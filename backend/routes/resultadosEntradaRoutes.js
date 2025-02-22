const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/listarEventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos where torneios_id = 3');
        res.json(rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos ==> ', erro);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar eventos',
            details: erro.message, // Adiciona detalhes do erro para debug
        });
    }
})

router.get('/listarProvasEvento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        const query = `
            SELECT DISTINCT
                ep.id AS eventos_provas_id,
                p.id AS prova_id,
                CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' (', p.sexo, ')') AS nome,
                p.estilo AS prova_estilo,
                p.distancia,
                p.tipo,
                p.sexo,
                ep.ordem
            FROM 
                inscricoes i
            JOIN 
                eventos_provas ep ON i.Eventos_Provas_id = ep.id
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                i.Eventos_id = ?
            ORDER BY ep.ordem ASC;
        `;
        const [rows] = await db.query(query, [eventoId]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar provas do evento:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar as provas.' });
    }
});

router.get('/listarBateriasProva/:provaId', async (req, res) => {
    const { provaId } = req.params;

    if (!provaId) {
        return res.status(400).json({
            success: false,
            message: 'Prova ID é obrigatório.',
        });
    }

    try {
        // Obter o eventos_provas_id correspondente ao provaId
        const [evRows] = await db.query(
            "SELECT id as eventosProvasId FROM eventos_provas WHERE provas_id = ?",
            [provaId]
        );
        if (evRows.length === 0) {
            throw new Error("Eventos_Provas não encontrado para provaId " + provaId);
        }
        const eventosProvasId = evRows[0].eventosProvasId;

        // Consulta as baterias e os nadadores associados à prova
        const [baterias] = await db.query(
            `
            SELECT
                b.id AS bateriaId,
                b.descricao AS numeroBateria,
                bi.raia,
                n.id AS nadadorId,
                n.nome AS nomeNadador
            FROM baterias b
            INNER JOIN baterias_inscricoes bi ON bi.Baterias_id = b.id
            INNER JOIN inscricoes i ON bi.Inscricoes_id = i.id
            INNER JOIN nadadores n ON i.Nadadores_id = n.id
            WHERE b.Provas_id = ?
            ORDER BY b.id, bi.raia
            `,
            [provaId]
        );

        // Verifica se existem resultados para os nadadores usando eventosProvasId
        for (const row of baterias) {
            console.log(`Buscando resultados para nadadorId: ${row.nadadorId}, eventosProvasId: ${eventosProvasId}`);
            const [resultados] = await db.query(
                'SELECT tempo, status FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ?',
                [row.nadadorId, eventosProvasId]
            );
            console.log(`Resultados retornados para nadadorId ${row.nadadorId}:`, resultados);
            if (resultados.length > 0) {
                console.log(`Encontrado resultado para nadadorId ${row.nadadorId}:`, resultados[0]);
                row.tempo = resultados[0].tempo;
                row.status = resultados[0].status;
            } else {
                console.log(`Nenhum resultado encontrado para nadadorId ${row.nadadorId}`);
                row.tempo = null;
                row.status = null;
            }
        }

        // Log para ver os dados vindos de resultados
        console.log('Dados das baterias com resultados:', baterias);

        // Organiza os dados por Séries
        const bateriasOrganizadas = baterias.reduce((acc, row) => {
            const { bateriaId, numeroBateria, raia, nadadorId, nomeNadador, tempo, status } = row;

            let bateria = acc.find((b) => b.bateriaId === bateriaId);
            if (!bateria) {
                bateria = {
                    bateriaId,
                    numeroBateria,
                    nadadores: [],
                };
                acc.push(bateria);
            }

            bateria.nadadores.push({
                id: nadadorId,
                nome: nomeNadador,
                raia,
                tempo,
                status,
            });

            return acc;
        }, []);

        res.status(200).json(bateriasOrganizadas);
    } catch (error) {
        console.error('Erro ao listar Séries da prova:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar Séries da prova.',
        });
    }
});


router.post('/salvarResultados', async (req, res) => {
    const { provaId, dados } = req.body;
    console.log('Dados recebidos no backend:', req.body);

    if (!provaId || !dados || !Array.isArray(dados)) {
        console.error('Parâmetros inválidos recebidos no endpoint salvarResultados');
        return res.status(400).json({
            success: false,
            message: 'Prova ID e dados das Séries são obrigatórios.',
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const bateria of dados) {
            console.log('Processando bateria:', bateria);
            const { nadadores } = bateria;
            if (!nadadores || !Array.isArray(nadadores)) {
                throw new Error('Dados de nadadores estão ausentes ou incorretos na bateria: ' + JSON.stringify(bateria));
            }

            for (const nadador of nadadores) {
                console.log('Processando nadador:', nadador);
                const { id: nadadorId, tempo, status } = nadador;
                if (!nadadorId || (tempo === undefined)) {
                    throw new Error('ID do nadador e tempo são obrigatórios. Nadador: ' + JSON.stringify(nadador));
                }

                // Log dos parâmetros para a query SELECT
                console.log(`Verificando existência para nadadorId ${nadadorId} e provaId ${provaId}`);

                const [existingRows] = await connection.query(
                    'SELECT id FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ? LIMIT 1',
                    [nadadorId, provaId]
                );
                console.log('Resultado da verificação:', existingRows);

                if (existingRows.length > 0) {
                    console.log(`Atualizando resultado para nadadorId ${nadadorId}`);
                    await connection.query(
                        'UPDATE resultados SET tempo = ?, status = ? WHERE id = ?',
                        [tempo, status, existingRows[0].id]
                    );
                } else {
                    console.log(`Inserindo novo resultado para nadadorId ${nadadorId}`);
                    await connection.query(
                        `INSERT INTO resultados (tempo, nadadores_id, eventos_provas_id, status)
                         VALUES (?, ?, ?, ?)`,
                        [tempo, nadadorId, provaId, status]
                    );
                }
            }
        }

        await connection.commit();
        console.log('Transação commitada com sucesso.');
        res.status(200).json({ success: true, message: 'Resultados salvos com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar resultados:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar resultados.' });
    } finally {
        connection.release();
    }
});

module.exports = router;