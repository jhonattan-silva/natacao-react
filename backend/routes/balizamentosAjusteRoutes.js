const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/listarEventos', async (req, res) => {
    try {
        const [torneio] = await db.query('SELECT id FROM torneios WHERE aberto = 1 ORDER BY id DESC LIMIT 1');
        let torneioId = torneio[0]?.id;

        if (!torneioId) {
            const [torneioRecente] = await db.query('SELECT id FROM torneios ORDER BY id DESC LIMIT 1');
            torneioId = torneioRecente[0]?.id;
        }

        if (!torneioId) {
            return res.json([]);
        }

        const [rows] = await db.query('SELECT * FROM eventos WHERE torneios_id = ?', [torneioId]);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ message: 'Erro ao buscar eventos.' });
    }
});

router.get('/listarBalizamento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;
    try {
        const [baterias] = await db.query('SELECT * FROM baterias WHERE eventos_id = ?', [eventoId]);

        const [eventosProvas] = await db.query(
            `SELECT ep.id, ep.provas_id, p.estilo, p.distancia, p.sexo, ep.ordem 
             FROM eventos_provas ep 
             JOIN provas p ON ep.provas_id = p.id 
             WHERE ep.eventos_id = ? 
             ORDER BY ep.ordem`,
            [eventoId]
        );

        let bateriasInscricoes = [];
        if (baterias.length > 0) {
            [bateriasInscricoes] = await db.query(
                `SELECT 
                    bi.inscricoes_id,
                    bi.raia,
                    b.descricao AS bateria_descricao,
                    n.nome,
                    ep.id AS eventos_provas_id
                 FROM baterias_inscricoes bi
                 JOIN baterias b ON bi.baterias_id = b.id
                 JOIN eventos_provas ep ON b.eventos_provas_id = ep.id
                 JOIN inscricoes i ON bi.inscricoes_id = i.id
                 JOIN nadadores n ON i.nadadores_id = n.id
                 WHERE ep.eventos_id = ?
                 ORDER BY b.descricao, bi.raia`,
                [eventoId]
            );
        }

        // Agrupar inscrições por prova e, dentro de cada prova, por bateria_descricao (séries)
        const grouped = eventosProvas.map(ep => {        
            // Use o campo eventos_provas_id para filtrar
            const bateriasInscricoesDoBloco = bateriasInscricoes.filter(ins => ins.eventos_provas_id === ep.id);
            
            // Agrupar por série (bateria_descricao)
            const seriesGrouped = bateriasInscricoesDoBloco.reduce((acc, ins) => {
                const key = ins.bateria_descricao;
                if (!acc[key]) acc[key] = [];
                acc[key].push(ins);
                return acc;
            }, {});
            
            // Converter para array de objetos
            const seriesArray = Object.entries(seriesGrouped).map(([bateria_descricao, dados]) => ({
                bateria_descricao, dados
            }));

            return {
                provaId: ep.id,   // Atualize para usar ep.id
                label: `${ep.estilo} ${ep.distancia} ${ep.sexo}`,
                series: seriesArray
            };
        });

        res.json({ provas: grouped });
    } catch (error) {
        console.error('Erro ao buscar dados de balizamento:', error);
        res.status(500).json({ message: 'Erro ao buscar dados de balizamento.' });
    }
});

//Buscar os inscritos de uma prova específica para serem add manualmente no balizamento
router.get('/listarInscritos/:eventoId/:provaId', async (req, res) => {
    const { eventoId, provaId } = req.params;

    try {
        const [inscritos] = await db.query(
            `SELECT i.id AS inscricao_id, n.id AS nadador_id, n.nome, e.id AS equipe_id, e.nome AS equipe_nome
             FROM inscricoes i
             JOIN nadadores n ON i.nadadores_id = n.id
             JOIN equipes e ON n.equipes_id = e.id
             WHERE i.eventos_id = ? AND i.eventos_provas_id = ?`,
            [eventoId, provaId]
        );

        res.json(inscritos);
    } catch (error) {
        console.error('Erro ao buscar inscritos:', error);
        res.status(500).json({ message: 'Erro ao buscar inscritos.' });
    }
});

// Buscar nadadores inscritos na prova que ainda NÃO estão em baterias
router.get('/buscarNadadoresDisponiveis/:eventoId/:provaId', async (req, res) => {
    const { eventoId, provaId } = req.params;
    const { termo } = req.query;
    console.log("Parametros recebidos em buscarNadadoresDisponiveis:", { eventoId, provaId, termo });
    try {
        let query = `
            SELECT i.id AS inscricao_id, n.id AS nadador_id, n.nome, e.id AS equipe_id, e.nome AS equipe_nome
            FROM inscricoes i
            JOIN nadadores n ON i.nadadores_id = n.id
            JOIN equipes e ON n.equipes_id = e.id
            WHERE i.eventos_id = ?
            AND i.eventos_provas_id = ?
        `;
        const params = [eventoId, provaId];
        if (termo && termo.trim() !== "") {
            query += " AND n.nome LIKE ? ";
            params.push(`%${termo}%`);
        }
        // Log para visualizar a query e parâmetros
        console.log("Query montada:", query, "Parametros:", params);

        // Para depuração, comente a cláusula "NOT IN" para verificar se o filtro de nome está funcionando:
        /*
        query += `
            AND i.id NOT IN (
                SELECT bi.inscricoes_id
                FROM baterias_inscricoes bi
                JOIN baterias b ON bi.baterias_id = b.id
                JOIN eventos_provas ep ON b.eventos_provas_id = ep.id
                WHERE ep.eventos_id = ?
                AND ep.id = ?
            )
        `;
        params.push(eventoId, provaId);
        */
        const [nadadoresDisponiveis] = await db.query(query, params);
        console.log("Nadadores encontrados:", nadadoresDisponiveis.length);
        res.json(nadadoresDisponiveis);
    } catch (error) {
        console.error('Erro ao buscar nadadores disponíveis:', error);
        res.status(500).json({ message: 'Erro ao buscar nadadores disponíveis.' });
    }
});



//Vai salvar o balizamento após a edição manual
router.post('/salvarBalizamento', async (req, res) => {
    const { eventoId, provas } = req.body; // `provas` contém os dados das baterias organizadas

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const prova of provas) {
            const { provaId, series } = prova;

            for (const serie of series) {
                const { bateria_descricao, dados } = serie;

                // Criar a bateria se não existir
                let [bateria] = await connection.query(
                    `SELECT id FROM baterias WHERE descricao = ? AND eventos_id = ? AND eventos_provas_id = ?`,
                    [bateria_descricao, eventoId, provaId]
                );

                let bateriaId;
                if (bateria.length === 0) {
                    const [insertResult] = await connection.query(
                        `INSERT INTO baterias (descricao, eventos_id, eventos_provas_id) VALUES (?, ?, ?)`,
                        [bateria_descricao, eventoId, provaId]
                    );
                    bateriaId = insertResult.insertId;
                } else {
                    bateriaId = bateria[0].id;
                }

                // Inserir nadadores na bateria
                for (const nadador of dados) {
                    const { inscricoes_id, piscina, raia } = nadador;

                    await connection.query(
                        `INSERT INTO baterias_inscricoes (baterias_id, inscricoes_id, piscina, raia)
                         VALUES (?, ?, ?, ?)`,
                        [bateriaId, inscricoes_id, piscina, raia]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Balizamento salvo com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar balizamento:', error);
        res.status(500).json({ message: 'Erro ao salvar balizamento.' });
    } finally {
        connection.release();
    }
});


module.exports = router;
