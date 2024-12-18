const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/listarEventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos');
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
                p.sexo
            FROM 
                inscricoes i
            JOIN 
                eventos_provas ep ON i.Eventos_Provas_id = ep.id
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                i.Eventos_id = ?;
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

        // Organiza os dados por baterias
        const bateriasOrganizadas = baterias.reduce((acc, row) => {
            const { bateriaId, numeroBateria, raia, nadadorId, nomeNadador, tempo } = row;

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
            });

            return acc;
        }, []);

        res.status(200).json(bateriasOrganizadas);
    } catch (error) {
        console.error('Erro ao listar baterias da prova:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar baterias da prova.',
        });
    }
});

router.post('/salvarResultados', async (req, res) => {
    const { provaId, dados } = req.body;

    if (!provaId || !dados || !Array.isArray(dados)) {
        return res.status(400).json({
            success: false,
            message: 'Prova ID e dados das baterias são obrigatórios.',
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Itera sobre os dados enviados
        for (const bateria of dados) {
            const { bateriaId, nadadores } = bateria;

            if (!nadadores || !Array.isArray(nadadores)) {
                throw new Error('Dados de nadadores estão ausentes ou incorretos.');
            }

            for (const nadador of nadadores) {
                const { id: nadadorId, tempo } = nadador;

                if (!nadadorId || !tempo) {
                    throw new Error('ID do nadador e tempo são obrigatórios.');
                }

                // Atualiza ou insere o tempo do nadador na tabela `baterias_inscricoes`
                await connection.query(
                    `
                    UPDATE baterias_inscricoes
                    SET tempo = ?
                    WHERE Inscricoes_id = (
                        SELECT id
                        FROM inscricoes
                        WHERE Nadadores_id = ? AND Eventos_Provas_id = ?
                    )
                    `,
                    [tempo, nadadorId, provaId]
                );
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Resultados salvos com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar resultados:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao salvar resultados.' });
    } finally {
        connection.release();
    }
});


module.exports = router;