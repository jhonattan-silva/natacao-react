const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * calcularRankingEquipes: Função para calcular o ranking das equipes
 * calcularRankingNadadores: Função para calcular o ranking dos nadadores
 * obterRankingEquipesPorEvento: Função para obter o ranking das equipes por evento
 * atualizarRanking: Rota para atualizar o ranking das equipes e nadadores
 * rankingEquipes: Rota para obter o ranking das equipes
 * ranking-equipes-por-evento: Rota para obter o ranking das equipes por evento
 */

// Função para calcular o ranking das equipes
const calcularRankingEquipes = async (conn, torneiosId) => {
    try {
        const [resultados] = await conn.execute(
            `SELECT c.equipes_id, SUM(c.pontuacao_equipe) AS total_pontos, ep.eventos_id, c.eventos_provas_id
             FROM classificacoes c
             JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
             JOIN eventos e ON ep.eventos_id = e.id
             WHERE e.torneios_id = ?
             GROUP BY c.equipes_id, c.eventos_provas_id`,
            [torneiosId]
        );

        // Atualiza rankingEquipes
        for (const row of resultados) {
            await conn.execute(
                `INSERT INTO rankingEquipes (torneios_id, eventos_id, eventos_provas_id, equipes_id, pontos)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE pontos = pontos + VALUES(pontos)`,
                [torneiosId, row.eventos_id, row.eventos_provas_id, row.equipes_id, row.total_pontos]
            );
        }
    } catch (error) {
        console.error("Erro ao calcular ranking de equipes:", error);
    }
};


// Função para calcular o ranking dos nadadores
const calcularRankingNadadores = async (conn, torneiosId) => {
    const [resultados] = await conn.execute(
        `SELECT c.nadadores_id, n.categorias_id, ep.eventos_id, c.eventos_provas_id, SUM(c.pontuacao_individual) AS total_pontos
         FROM classificacoes c
         JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
         JOIN eventos e ON ep.eventos_id = e.id
         JOIN nadadores n ON c.nadadores_id = n.id
         WHERE e.torneios_id = ?
         GROUP BY c.nadadores_id, n.categorias_id, ep.eventos_id, c.eventos_provas_id`,
        [torneiosId]
    );

    for (const row of resultados) {
        await conn.execute(
            `INSERT INTO rankingNadadores (torneios_id, nadadores_id, categorias_id, eventos_id, eventos_provas_id, pontos)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE pontos = VALUES(pontos)` ,
            [torneiosId, row.nadadores_id, row.categorias_id, row.eventos_id, row.eventos_provas_id, row.total_pontos]
        );
    }
};


const obterRankingEquipesPorEvento = async (conn, eventosId) => {
    try {
        const [ranking] = await conn.execute(
            `SELECT e.nome AS equipe, ev.nome AS evento, SUM(r.pontos) AS pontos
             FROM rankingEquipes r
             JOIN equipes e ON r.equipes_id = e.id
             JOIN eventos ev ON r.eventos_id = ev.id
             WHERE r.eventos_id = ?
             GROUP BY e.nome, ev.nome
             ORDER BY pontos DESC`,
            [eventosId]
        );
        return ranking;
    } catch (error) {
        console.error("Erro ao obter ranking das equipes por evento:", error);
        throw error;
    }
};

// Rota para calcular e atualizar os rankings usando transação
router.post('/atualizar-ranking/:torneiosId', async (req, res) => {
    let connection;
    try {
        const { torneiosId } = req.params;
        if (!torneiosId) {
            return res.status(400).json({ error: "O ID do torneio é obrigatório!" });
        }
        
        // Adquire uma conexão da pool e inicia a transação
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        // Limpa rankings anteriores dentro da transação
        await connection.execute(`DELETE FROM rankingEquipes WHERE torneios_id = ?`, [torneiosId]);
        await connection.execute(`DELETE FROM rankingNadadores WHERE torneios_id = ?`, [torneiosId]);

        // Calcula e insere os novos rankings usando a mesma conexão
        await calcularRankingEquipes(connection, torneiosId);
        await calcularRankingNadadores(connection, torneiosId);
        
        // Confirma as operações
        await connection.commit();
        connection.release();

        res.status(200).json({ message: "Ranking atualizado com sucesso!" });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o ranking." });
    }
});

// Rota para obter o ranking das equipes
router.get('/ranking-equipes/:torneiosId', async (req, res) => {
    try {
        const { torneiosId } = req.params;
        const [ranking] = await db.execute(
            `SELECT e.nome AS 'Equipe', SUM(r.pontos) AS 'Pontos' 
             FROM rankingEquipes r 
             JOIN equipes e ON r.equipes_id = e.id
             WHERE r.torneios_id = ?
             GROUP BY e.nome
             ORDER BY pontos DESC`,
            [torneiosId]
        );
        res.status(200).json(ranking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar o ranking das equipes." });
    }
});

// Rota para obter o ranking dos nadadores (separado por gênero)
router.get('/ranking-nadadores/:torneiosId', async (req, res) => {
    try {
        const { torneiosId } = req.params;
        const [masculinoRanking] = await db.execute(
            `SELECT n.nome AS 'Nadador', c.nome AS 'Categoria', e.nome AS 'Equipe', SUM(r.pontos) AS 'Pontos'
             FROM rankingNadadores r
             JOIN nadadores n ON r.nadadores_id = n.id
             JOIN categorias c ON r.categorias_id = c.id
             JOIN equipes e ON n.equipes_id = e.id
             WHERE r.torneios_id = ? AND n.sexo = 'M'
             GROUP BY n.nome, c.nome, e.nome
             ORDER BY c.nome ASC, pontos DESC`,
            [torneiosId]
        );

        const [femininoRanking] = await db.execute(
            `SELECT n.nome AS 'Nadadora', c.nome AS 'Categoria', e.nome AS 'Equipe', SUM(r.pontos) AS 'Pontos'
             FROM rankingNadadores r
             JOIN nadadores n ON r.nadadores_id = n.id
             JOIN categorias c ON r.categorias_id = c.id
             JOIN equipes e ON n.equipes_id = e.id
             WHERE r.torneios_id = ? AND n.sexo = 'F'
             GROUP BY n.nome, c.nome, e.nome
             ORDER BY c.nome ASC, pontos DESC`,
            [torneiosId]
        );

        res.status(200).json({ masculino: masculinoRanking, feminino: femininoRanking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar o ranking dos nadadores." });
    }
});

router.get('/ranking-equipes-por-evento/:eventosId', async (req, res) => {
    try {
        const { eventosId } = req.params;
        if (!eventosId) {
            return res.status(400).json({ error: "O ID do evento é obrigatório!" });
        }

        const connection = await db.getConnection();
        const ranking = await obterRankingEquipesPorEvento(connection, eventosId);
        connection.release();

        res.status(200).json(ranking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar o ranking das equipes por evento." });
    }
});

module.exports = router;
