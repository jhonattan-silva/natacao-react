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
        const [rows] = await db.query(`
            SELECT n.*, e.nome AS equipe_nome
            FROM nadadores n
            JOIN equipes e ON n.equipes_id = e.id
            WHERE n.equipes_id = ? AND n.ativo = 1
            ORDER BY n.nome ASC
        `, [equipeId]); // Busca todos os nadadores
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

// Rota para listar inscrições de uma equipe específica em um evento
router.get('/listarInscricoes/:eventoId', async (req, res) => {
    const { eventoId } = req.params;
    const { equipeId } = req.query; // Adicionado para filtrar por equipe

    if (!equipeId) {
        return res.status(400).json({ message: 'Equipe ID é necessário' });
    }

    try {
        const [inscricoesIndividuais] = await db.query(`
            SELECT 
                i.nadadores_id AS nadadorId,
                n.nome AS nadadorNome,
                i.eventos_provas_id AS provaId,
                p.estilo,
                p.distancia,
                i.minutos,
                i.segundos,
                i.centesimos,
                COALESCE(
                  CONCAT(
                    LPAD(i.minutos, 2, '0'), ':',
                    LPAD(i.segundos, 2, '0'), ':',
                    LPAD(i.centesimos, 2, '0')
                  ), '00:00:00'
                ) AS melhor_tempo
            FROM inscricoes i
            JOIN nadadores n ON n.id = i.nadadores_id
            JOIN eventos_provas ep ON ep.id = i.eventos_provas_id
            JOIN provas p ON p.id = ep.provas_id
            WHERE i.eventos_id = ? AND n.equipes_id = ?
        `, [eventoId, equipeId]);

        const [inscricoesRevezamento] = await db.query(`
            SELECT 
                r.equipes_id AS equipeId,
                r.eventos_provas_id AS provaId,
                p.estilo,
                p.distancia,
                p.sexo,
                r.minutos,
                r.segundos,
                r.centesimos,
                COALESCE(
                  CONCAT(
                    LPAD(r.minutos, 2, '0'), ':',
                    LPAD(r.segundos, 2, '0'), ':',
                    LPAD(r.centesimos, 2, '0')
                  ), '00:00:00'
                ) AS melhor_tempo
            FROM revezamentos_inscricoes r
            JOIN eventos_provas ep ON ep.id = r.eventos_provas_id
            JOIN provas p ON p.id = ep.provas_id
            WHERE r.eventos_id = ? AND r.equipes_id = ?
        `, [eventoId, equipeId]);

        res.json({ inscricoesIndividuais, inscricoesRevezamento });
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        res.status(500).json({ message: 'Erro ao buscar inscrições.' });
    }
});

// Rota para verificar inscrições de revezamento diretamente
router.get('/verificarRevezamento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;
    const { equipeId } = req.query;
    if (!equipeId) {
        return res.status(400).json({ message: 'Equipe ID é necessário' });
    }
    try {
        const [rows] = await db.query(
            'SELECT eventos_provas_id AS provaId FROM revezamentos_inscricoes WHERE eventos_id = ? AND equipes_id = ?',
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

    const eventoId = inscricoes[0]?.eventoId; // EVENTO
    const equipeId = inscricoes[0]?.equipeId; // EQUIPE

    if (!eventoId) {
        return res.status(400).json({ message: 'Evento ID é necessário para salvar inscrições.' });
    }
    if (!equipeId) {
        return res.status(400).json({ message: 'Equipe ID é necessário para salvar inscrições.' });
    }

    // Validação para impedir que o mesmo nadador seja inscrito em mais de duas provas
    const inscricoesIndividuais = inscricoes.filter(inscricao => inscricao.nadadorId);
    const quantidadePorNadador = {};

    for (const inscricao of inscricoesIndividuais) {
        quantidadePorNadador[inscricao.nadadorId] = (quantidadePorNadador[inscricao.nadadorId] || 0) + 1;
        if (quantidadePorNadador[inscricao.nadadorId] > 2) {
            return res.status(400).json({ message: 'Um nadador não pode ser inscrito em mais de duas provas.' });
        }
    }

    // Regra: se escolher 25m, a outra prova tambem deve ser 25m
    const provaIds = [...new Set(inscricoesIndividuais.map(inscricao => inscricao.provaId))];
    const distanciaPorProvaId = {};

    if (provaIds.length > 0) {
        const placeholders = provaIds.map(() => '?').join(',');
        const [rows] = await db.query(
            `SELECT ep.id AS eventos_provas_id, p.distancia
             FROM eventos_provas ep
             JOIN provas p ON ep.provas_id = p.id
             WHERE ep.id IN (${placeholders})`,
            provaIds
        );

        rows.forEach(row => {
            distanciaPorProvaId[String(row.eventos_provas_id)] = String(row.distancia);
        });
    }

    const regra25PorNadador = {};
    for (const inscricao of inscricoesIndividuais) {
        const provaId = String(inscricao.provaId);
        const distancia = distanciaPorProvaId[provaId];

        if (!distancia) {
            return res.status(400).json({ message: 'Não foi possível validar a distância da prova.' });
        }

        if (!regra25PorNadador[inscricao.nadadorId]) {
            regra25PorNadador[inscricao.nadadorId] = { has25: false, hasNon25: false };
        }

        if (distancia === '25') {
            regra25PorNadador[inscricao.nadadorId].has25 = true;
        } else {
            regra25PorNadador[inscricao.nadadorId].hasNon25 = true;
        }

        const estado = regra25PorNadador[inscricao.nadadorId];
        if (estado.has25 && estado.hasNon25) {
            return res.status(400).json({ message: 'Se escolher uma prova de 25m, a outra também deve ser de 25m.' });
        }
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
            INSERT INTO inscricoes (nadadores_id, eventos_id, eventos_provas_id, minutos, segundos, centesimos)
            SELECT * FROM (
                SELECT ? AS nadadores_id, ? AS eventos_id, ? AS eventos_provas_id, ? AS minutos, ? AS segundos, ? AS centesimos
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT 1 FROM inscricoes 
                WHERE nadadores_id = ? 
                AND eventos_id = ? 
                AND eventos_provas_id = ?
            ) LIMIT 1;`;

        // Inserir novas inscrições de revezamento, evitando duplicações
        const queryRevezamento = `
            INSERT INTO revezamentos_inscricoes (eventos_id, eventos_provas_id, equipes_id, minutos, segundos, centesimos)
            SELECT * FROM (
                SELECT ? AS eventos_id, ? AS eventos_provas_id, ? AS equipes_id, ? AS minutos, ? AS segundos, ? AS centesimos
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT 1 FROM revezamentos_inscricoes 
                WHERE eventos_id = ? 
                AND eventos_provas_id = ? 
                AND equipes_id = ?
            ) LIMIT 1;`;

        // Percorrer as inscrições e inserir no banco de dados
        for (const inscricao of inscricoes) {
            if (inscricao.nadadorId) { // Inscrição individual
                // Buscar o provas_id a partir do eventos_provas_id
                const [provaRow] = await connection.query(
                    `SELECT provas_id FROM eventos_provas WHERE id = ?`,
                    [inscricao.provaId]
                );
                const provasId = provaRow[0]?.provas_id;

                // Verificar se o nadador tem record na prova específica
                let minutos = null, segundos = null, centesimos = null;
                if (provasId) {
                    const [record] = await connection.query(
                        `SELECT minutos, segundos, centesimos 
                         FROM records 
                         WHERE nadadores_id = ? AND provas_id = ?`,
                        [inscricao.nadadorId, provasId]
                    );

                    // 🔹 Uso ?? em vez de || para aceitar 0
                    minutos = record[0]?.minutos ?? null;
                    segundos = record[0]?.segundos ?? null;
                    centesimos = record[0]?.centesimos ?? null;
                }

                await connection.query(queryIndividual, [
                    inscricao.nadadorId, eventoId, inscricao.provaId, minutos, segundos, centesimos,
                    inscricao.nadadorId, eventoId, inscricao.provaId
                ]);
            }
            if (inscricao.equipeId && !inscricao.nadadorId) { // Inscrição em revezamento
                // Buscar o provas_id a partir do eventos_provas_id
                const [provaRow] = await connection.query(
                    `SELECT provas_id FROM eventos_provas WHERE id = ?`,
                    [inscricao.provaId]
                );
                const provasId = provaRow[0]?.provas_id;

                // Buscar tempo da equipe na prova de revezamento
                let minutos = null, segundos = null, centesimos = null;
                if (provasId) {
                    const [recordEquipe] = await connection.query(
                        `SELECT minutos, segundos, centesimos 
                         FROM recordsEquipes 
                         WHERE equipes_id = ? AND provas_id = ?`,
                        [inscricao.equipeId, provasId]
                    );
                    // 🔹 Uso ?? em vez de || para aceitar 0
                    minutos = recordEquipe[0]?.minutos ?? null;
                    segundos = recordEquipe[0]?.segundos ?? null;
                    centesimos = recordEquipe[0]?.centesimos ?? null;
                }

                await connection.query(queryRevezamento, [
                    eventoId, inscricao.provaId, inscricao.equipeId, minutos, segundos, centesimos,
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
