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
                CONCAT(p.estilo, ' ', p.distancia, 'm ', ' (', p.sexo, ')') AS nome,
                p.estilo AS prova_estilo,
                p.distancia,
                p.sexo,
                ep.ordem
            FROM 
                eventos_provas ep
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                ep.eventos_id = ?
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
                n.nome AS nomeNadador,
                e.id AS equipeId,
                e.nome AS nomeEquipe
            FROM baterias b
            INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
            LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
            LEFT JOIN nadadores n ON i.nadadores_id = n.id
            LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
            LEFT JOIN equipes e ON ri.equipes_id = e.id
            WHERE b.eventos_provas_id = ?
            ORDER BY b.id, bi.raia;
            `,
            [eventosProvasId] // Passa o eventos_provas_id como parâmetro
        );

        // Verifica se existem resultados para os nadadores usando eventosProvasId
        for (const row of baterias) {
            // Atualiza a query para selecionar os novos campos
            const [resultados] = await db.query(
                'SELECT minutos, segundos, centesimos, status FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ?',
                [row.nadadorId, eventosProvasId]
            );
            if (resultados.length > 0) {
                const { minutos, segundos, centesimos, status } = resultados[0];
                // Formata os campos para "mm:ss:cc"
                row.tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
                row.status = status;
            } else {
                row.tempo = null;
                row.status = null;
            }
        }

        // Organiza os dados por Séries
        const bateriasOrganizadas = baterias.reduce((acc, row) => {
            const { bateriaId, numeroBateria, raia, nadadorId, nomeNadador, tempo, status, equipeId, nomeEquipe } = row;

            let bateria = acc.find((b) => b.bateriaId === bateriaId);
            if (!bateria) {
                bateria = {
                    bateriaId,
                    numeroBateria,
                    nadadores: [],
                    equipes: []
                };
                acc.push(bateria);
            }

            if (nadadorId) {
                bateria.nadadores.push({
                    id: nadadorId,
                    nome: nomeNadador,
                    raia,
                    tempo,
                    status,
                });
            }

            if (equipeId) {
                bateria.equipes.push({
                    id: equipeId,
                    nome: nomeEquipe,
                    raia,
                    tempo,
                    status,
                });
            }

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

// Atualiza a função auxiliar para manter o formato "mm:ss:cc" conforme entrada
function formatTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '00:00:00';
    const parts = timeStr.split(':');
    if (parts.length < 3) return '00:00:00';
    return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}:${parts[2].padStart(2,'0')}`;
}

// Nova função auxiliar para converter "mm:ss:cc" em objeto { minutos, segundos, centesimos }
function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return { minutos: 0, segundos: 0, centesimos: 0 };
    const parts = timeStr.split(':');
    if (parts.length < 3) return { minutos: 0, segundos: 0, centesimos: 0 };
    return {
        minutos: parseInt(parts[0], 10),
        segundos: parseInt(parts[1], 10),
        centesimos: parseInt(parts[2], 10)
    };
}

router.post('/salvarResultados', async (req, res) => {
    // Agora espera: { provaId, (opcional etapaId), dados }
    const { provaId, etapaId, dados } = req.body;

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
        // ...existing processing dos dados e inserção/atualização de resultados...
        for (const bateria of dados) {
            // ...existing code...
            const { nadadores, equipes } = bateria;
            if (!nadadores && !equipes) {
                throw new Error('Dados de nadadores ou equipes estão ausentes na bateria: ' + JSON.stringify(bateria));
            }
            if (nadadores) {
                for (const nadador of nadadores) {
                    // ...existing code...
                    const { id: nadadorId, tempo, status } = nadador;
                    if (!nadadorId || (tempo === undefined)) {
                        throw new Error('ID do nadador e tempo são obrigatórios. Nadador: ' + JSON.stringify(nadador));
                    }
                    const parsedTime = parseTime(tempo);
                    const [existingRows] = await connection.query(
                        'SELECT id FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ? LIMIT 1',
                        [nadadorId, provaId]
                    );
                    if (existingRows.length > 0) {
                        await connection.query(
                            'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ?, equipes_id = NULL WHERE id = ?',
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, existingRows[0].id]
                        );
                    } else {
                        await connection.query(
                            `INSERT INTO resultados (minutos, segundos, centesimos, nadadores_id, eventos_provas_id, status, equipes_id)
                             VALUES (?, ?, ?, ?, ?, ?, NULL)`,
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, nadadorId, provaId, status]
                        );
                    }
                }
            }
            if (equipes) {
                for (const equipe of equipes) {
                    const { id: equipeId, tempo, status } = equipe;
                    if (!equipeId || (tempo === undefined)) {
                        throw new Error('ID da equipe e tempo são obrigatórios. Equipe: ' + JSON.stringify(equipe));
                    }
                    const parsedTime = parseTime(tempo);
                    const [existingRows] = await connection.query(
                        'SELECT id FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ? LIMIT 1',
                        [equipeId, provaId]
                    );
                    if (existingRows.length > 0) {
                        await connection.query(
                            'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ?, nadadores_id = NULL WHERE id = ?',
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, existingRows[0].id]
                        );
                    } else {
                        await connection.query(
                            `INSERT INTO resultados (minutos, segundos, centesimos, equipes_id, eventos_provas_id, status, nadadores_id)
                             VALUES (?, ?, ?, ?, ?, ?, NULL)`,
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, equipeId, provaId, status]
                        );
                    }
                }
            }
        }
        
        // Atualiza teve_resultados
        if (etapaId) {
            await connection.query(
                'UPDATE eventos SET teve_resultados = 1 WHERE id = ?',
                [etapaId]
            );
        } else {
            // Caso etapaId não seja informado, buscar Eventos_id da tabela eventos_provas usando provaId
            const [rows] = await connection.query(
                'SELECT Eventos_id FROM eventos_provas WHERE id = ?',
                [provaId]
            );
            if (rows.length > 0) {
                await connection.query(
                    'UPDATE eventos SET teve_resultados = 1 WHERE id = ?',
                    [rows[0].Eventos_id]
                );
            }
        }

        await connection.commit();
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