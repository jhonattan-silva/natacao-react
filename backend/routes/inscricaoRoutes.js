const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todos EVENTOS
router.get('/listarEventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos WHERE inscricao_aberta = 1'); // Busca todos os eventos
        res.json(rows); // Retorna a lista de eventos em JSON
    } catch (error) {
        console.error('Erro ao buscar eventos:', error); // Loga o erro no servidor
        res.status(500).json({ message: 'Erro ao buscar eventos.' }); // Retorna mensagem de erro ao cliente
    }
});

// Listar todos NADADORES
router.get('/listarNadadores/:equipeId', async (req, res) => {
    try {
        const { equipeId } = req.params; // Extrai o equipeId da rota
        const [rows] = await db.query('SELECT * FROM nadadores WHERE equipes_id = ?', [equipeId]); // Busca todos os nadadores
        res.json(rows); // Retorna a lista de nadadores em JSON
    } catch (error) {
        console.error('Erro ao buscar nadadores:', error); // Loga o erro no servidor
        res.status(500).json({ message: 'Erro ao buscar nadadores.' }); // Retorna mensagem de erro ao cliente
    }
});

// Rota para listar provas de um evento específico
router.get('/listarProvasEvento/:eventoId', async (req, res) => {
    const eventoId = req.params.eventoId;
    const equipeId = req.query.equipeId;

    if (!eventoId) {
        return res.status(400).json({ message: 'Evento ID é necessário' }); // Retorna erro se não houver ID do evento
    }

    try {
        // Buscar provas associadas ao evento específico
        const [provas] = await db.query(`
            SELECT p.*, ep.*
            FROM eventos_provas ep
            JOIN provas p ON ep.provas_id = p.id
            WHERE ep.eventos_id = ?
            ORDER BY ep.ordem
        `, [eventoId]);

        // Buscar nadadores pelo equipes_id
        const [nadadores] = await db.query('SELECT * FROM nadadores WHERE equipes_id = ?', [equipeId]);

        // Retorna os dados no formato esperado pelo frontend
        res.json({ provas, nadadores });
    } catch (error) {
        console.error('Erro ao buscar provas e nadadores:', error);
        res.status(500).json({ message: 'Ocorreu um erro ao buscar as provas e nadadores.' });
    }
});

// Nova rota para buscar inscrições (nadadores e revezamento) existentes de um evento específico
router.get('/listarInscricoes/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        const [inscricoesIndividuais] = await db.query(`
            SELECT nadadores_id AS nadadorId, eventos_provas_id AS provaId 
            FROM inscricoes
            WHERE eventos_id = ?
        `, [eventoId]);

        const [inscricoesRevezamento] = await db.query(`
            SELECT equipes_id AS equipeId, provas_id AS provaId
            FROM revezamentos_inscricoes
            WHERE eventos_id = ?
        `, [eventoId]);

        res.json({ inscricoesIndividuais, inscricoesRevezamento });
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        res.status(500).json({ message: 'Erro ao buscar inscrições.' });
    }
});

// Rota para salvar as inscrições dos nadadores nas provas e da equipe nos revezamentos
router.post('/salvarInscricao', async (req, res) => {
    const inscricoes = req.body;
    const eventoId = inscricoes[0]?.eventoId;

    if (!eventoId) {
        return res.status(400).json({ message: 'Evento ID é necessário para salvar inscrições.' });
    }

    try {
        await db.query('DELETE FROM inscricoes WHERE eventos_id = ?', [eventoId]);
        await db.query('DELETE FROM revezamentos_inscricoes WHERE eventos_id = ?', [eventoId]); // Limpa revezamentos também

        for (const inscricao of inscricoes) {
            if (inscricao.nadadorId) {
                await db.query(
                    'INSERT INTO inscricoes (nadadores_id, eventos_id, eventos_provas_id) VALUES (?, ?, ?)',
                    [inscricao.nadadorId, eventoId, inscricao.provaId]
                );
            } else if (inscricao.equipeId) {
                await db.query(
                    'INSERT INTO revezamentos_inscricoes (eventos_id, provas_id, equipes_id) VALUES (?, ?, ?)',
                    [eventoId, inscricao.provaId, inscricao.equipeId]
                );
            }
        }

        res.json({ message: 'Inscrições atualizadas com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar inscrições:', error);
        res.status(500).json({ message: 'Erro ao atualizar inscrições.' });
    }
});

module.exports = router;
