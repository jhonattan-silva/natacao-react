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

        // Obter se a prova é revezamento
        const [provaRows] = await db.query(
            'SELECT eh_revezamento FROM provas WHERE id = ?',
            [provaId]
        );
        const ehRevezamento = provaRows.length > 0 ? Boolean(provaRows[0].eh_revezamento) : false;

        let baterias;
        if (!ehRevezamento) {
            // Consulta as baterias e os nadadores associados à prova
            [baterias] = await db.query(
                `
                SELECT
                    b.id AS bateriaId,
                    b.descricao AS numeroBateria,
                    bi.raia,
                    n.id AS nadadorId,
                    n.nome AS nomeNadador,
                    n.equipes_id AS equipeId,  
                    eq.nome AS nomeEquipe
                FROM baterias b
                INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
                LEFT JOIN nadadores n ON i.nadadores_id = n.id
                LEFT JOIN equipes eq ON n.equipes_id = eq.id 
                WHERE b.eventos_provas_id = ?
                ORDER BY b.id, bi.raia;
                `,
                [eventosProvasId] // Passa o eventos_provas_id como parâmetro
            );
        } else {
            // Consulta as baterias e os revezamentos associados à prova
            [baterias] = await db.query(
                `
                SELECT
                    b.id AS bateriaId,
                    b.descricao AS numeroBateria,
                    bi.raia,
                    ri.equipes_id AS equipeId,
                    eq.nome AS nomeEquipe
                FROM baterias b
                INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
                LEFT JOIN equipes eq ON ri.equipes_id = eq.id
                WHERE b.eventos_provas_id = ?
                ORDER BY b.id, bi.raia;
                `,
                [eventosProvasId] // Passa o eventos_provas_id como parâmetro
            );
        }

        // Verifica se existem resultados para os nadadores usando eventosProvasId
        for (const row of baterias) {
            if (!ehRevezamento) {
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
            } else {
                // Atualiza a query para selecionar os novos campos
                const [resultados] = await db.query(
                    'SELECT minutos, segundos, centesimos, status FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ?',
                    [row.equipeId, eventosProvasId]
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

            if (!ehRevezamento && nadadorId) {
                bateria.nadadores.push({
                    id: nadadorId,
                    nome: nomeNadador,
                    raia,
                    tempo,
                    status,
                    equipeId // Adiciona equipeId ao objeto nadador
                });
            }

            if (ehRevezamento && equipeId) {
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
    const { provaId, etapaId, dados } = req.body;

    if (!provaId || !dados || !Array.isArray(dados)) {
        return res.status(400).json({
            success: false,
            message: 'Prova ID e dados das Séries são obrigatórios.',
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [provaRows] = await connection.query(
            'SELECT eh_revezamento FROM provas WHERE id = ?',
            [provaId]
        );
        const ehRevezamento = provaRows.length > 0 ? Boolean(provaRows[0].eh_revezamento) : false;

        for (const bateria of dados) {
            const { nadadores, equipes } = bateria;
            
            if ((!nadadores || nadadores.length === 0) && (!equipes || equipes.length === 0)) {
                throw new Error('Dados de nadadores ou equipes estão ausentes ou vazios.');
            }
            
            if (nadadores) {
                for (const nadador of nadadores) {
                    const { id: nadadorId, tempo, status, equipeId } = nadador;
                    
                    if (!nadadorId || tempo === undefined || !equipeId) {
                        throw new Error('ID do nadador, equipe e tempo são obrigatórios.');
                    }
                    
                    const parsedTime = parseTime(tempo);
                    const [existingRows] = await connection.query(
                        'SELECT id FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ? LIMIT 1',
                        [nadadorId, provaId]
                    );

                    if (existingRows.length > 0) {
                        await connection.query(
                            'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ?, equipes_id = ? WHERE id = ?',
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, equipeId, existingRows[0].id]
                        );
                    } else {
                        await connection.query(
                            `INSERT INTO resultados (minutos, segundos, centesimos, nadadores_id, eventos_provas_id, status, equipes_id)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, nadadorId, provaId, status, equipeId]
                        );
                    }
                }
            }
            
            if (ehRevezamento) { 
                console.log("ENTROU NO REVEZAMENTO");
                
                for (const equipe of equipes) {
                    const { id: equipeId, tempo, status } = equipe;
                    
                    if (!equipeId || tempo === undefined) {
                        throw new Error('ID da equipe e tempo são obrigatórios.');
                    }
                    
                    if (!ehRevezamento) {
                        throw new Error('Só é permitido inserir resultados sem nadadores_id se for revezamento.');
                    }
                    
                    const parsedTime = parseTime(tempo);
                    const [existingRows] = await connection.query(
                        'SELECT id FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ? LIMIT 1',
                        [equipeId, provaId]
                    );

                    if (existingRows.length > 0) {
                        await connection.query(
                            'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ? WHERE id = ?',
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, existingRows[0].id]
                        );
                    } else {
                        await connection.query(
                            `INSERT INTO resultados (minutos, segundos, centesimos, equipes_id, eventos_provas_id, status)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, equipeId, provaId, status]
                        );
                    }
                }
            }
        }

        const [rows] = await connection.query(
            'SELECT COALESCE(?, eventos_id) as eventoId FROM eventos_provas WHERE id = ?',
            [etapaId, provaId]
        );
        if (rows.length > 0) {
            await connection.query(
                'UPDATE eventos SET teve_resultados = 1 WHERE id = ?',
                [rows[0].eventoId]
            );
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Resultados salvos com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar resultados:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;