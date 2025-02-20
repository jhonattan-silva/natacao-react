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
        // Alteração: incluir filtro para nadadores ativos e ordenar alfabeticamente pelo nome
        const [rows] = await db.query('SELECT * FROM nadadores WHERE equipes_id = ? AND ativo = 1 ORDER BY nome ASC', [equipeId]); // Busca todos os nadadores
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

// Nova rota para verificar inscrições de revezamento diretamente
router.get('/verificarRevezamento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;
    const { equipeId } = req.query;
    if (!equipeId) {
        return res.status(400).json({ message: 'Equipe ID é necessário' });
    }
    try {
        const [rows] = await db.query(
            'SELECT provas_id AS provaId FROM revezamentos_inscricoes WHERE eventos_id = ? AND equipes_id = ?',
            [eventoId, equipeId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar inscrições de revezamento:', error);
        res.status(500).json({ message: 'Erro ao buscar inscrições de revezamento.' });
    }
});

// Rota para salvar as inscrições dos nadadores nas provas e da equipe nos revezamentos
router.post('/salvarInscricao', async (req, res) => {
    const inscricoes = req.body;

    if (!inscricoes.length) {
        return res.status(400).json({ message: 'Nenhuma inscrição enviada.' });
    }

    const eventoId = inscricoes[0]?.eventoId;
    const equipeId = inscricoes[0]?.equipeId;

    if (!eventoId) {
        return res.status(400).json({ message: 'Evento ID é necessário para salvar inscrições.' });
    }
    if (!equipeId) {
        return res.status(400).json({ message: 'Equipe ID é necessário para salvar inscrições.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); // Inicia a transação

        // Excluir apenas as inscrições INDIVIDUAIS da equipe no evento
        await connection.query(
            `DELETE FROM inscricoes 
             WHERE eventos_id = ? 
             AND nadadores_id IN (SELECT id FROM nadadores WHERE equipes_id = ?)`,
            [eventoId, equipeId]
        );

        // Excluir apenas as inscrições de REVEZAMENTO da equipe no evento
        await connection.query(
            `DELETE FROM revezamentos_inscricoes 
             WHERE eventos_id = ? 
             AND equipes_id = ?`,
            [eventoId, equipeId]
        );

        // Inserir novas inscrições individuais, evitando duplicações
        const queryIndividual = `
            INSERT INTO inscricoes (nadadores_id, eventos_id, eventos_provas_id)
            SELECT * FROM (
                SELECT ? AS nadadores_id, ? AS eventos_id, ? AS eventos_provas_id
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT 1 FROM inscricoes 
                WHERE nadadores_id = ? 
                AND eventos_id = ? 
                AND eventos_provas_id = ?
            ) LIMIT 1;`;

        // Inserir novas inscrições de revezamento, evitando duplicações
        const queryRevezamento = `
            INSERT INTO revezamentos_inscricoes (eventos_id, provas_id, equipes_id)
            SELECT * FROM (
                SELECT ? AS eventos_id, ? AS provas_id, ? AS equipes_id
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT 1 FROM revezamentos_inscricoes 
                WHERE eventos_id = ? 
                AND provas_id = ? 
                AND equipes_id = ?
            ) LIMIT 1;`;

        for (const inscricao of inscricoes) {
            if (inscricao.nadadorId) { // Inscrição individual
                await connection.query(queryIndividual, [
                    inscricao.nadadorId, eventoId, inscricao.provaId, 
                    inscricao.nadadorId, eventoId, inscricao.provaId
                ]);
            }
            if (inscricao.equipeId && !inscricao.nadadorId) { // Inscrição em revezamento
                await connection.query(queryRevezamento, [
                    eventoId, inscricao.provaId, inscricao.equipeId, 
                    eventoId, inscricao.provaId, inscricao.equipeId
                ]);
            }
        }

        await connection.commit(); // Confirma a transação
        res.json({ message: 'Inscrições atualizadas com sucesso!' });

    } catch (error) {
        await connection.rollback(); // Reverte alterações em caso de erro
        console.error('Erro ao atualizar inscrições:', error);
        res.status(500).json({ message: 'Erro ao atualizar inscrições.' });
    } finally {
        connection.release(); // Libera a conexão
    }
});

module.exports = router;
