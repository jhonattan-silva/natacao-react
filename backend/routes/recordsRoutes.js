const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para listar anos que têm records disponíveis
router.get('/anos-disponiveis', async (req, res) => {
    try {
        const [anos] = await db.execute(
            `SELECT DISTINCT YEAR(t.data_inicio) AS ano
             FROM records r
             JOIN torneios t ON r.torneios_id = t.id
             ORDER BY ano DESC`
        );

        res.json(anos.map(row => ({ id: row.ano, nome: row.ano })));
    } catch (error) {
        console.error('Erro ao buscar anos com records:', error);
        res.status(500).json({ error: 'Erro ao buscar anos com records.' });
    }
});

// Rota para obter filtros (provas e categorias)
router.get('/filtros', async (req, res) => {
    const { ano } = req.query;
    try {
        let query = `SELECT DISTINCT p.id, CONCAT(p.distancia, 'm ', p.estilo) AS prova, p.sexo
                     FROM records r
                     JOIN provas p ON r.provas_id = p.id
                     JOIN torneios t ON r.torneios_id = t.id`;
        let params = [];

        // Se ano não for "absoluto", filtrar por ano específico
        if (ano !== 'absoluto') {
            query += ` WHERE YEAR(t.data_inicio) = ?`;
            params.push(ano);
        }

        const [provas] = await db.execute(query, params);

        const [categorias] = await db.execute(
            `SELECT DISTINCT nome AS categoria
             FROM categorias`
        );

        // Organiza as provas por sexo
        const provasPorSexo = provas.reduce((acc, prova) => {
            if (!acc[prova.sexo]) {
                acc[prova.sexo] = [];
            }
            acc[prova.sexo].push({ id: prova.id, nome: prova.prova });
            return acc;
        }, {});

        res.json({
            provas: provasPorSexo,
            categorias: categorias.map(c => ({ id: c.categoria, nome: c.categoria }))
        });
    } catch (error) {
        console.error('Erro ao buscar filtros:', error);
        res.status(500).json({ error: 'Erro ao buscar filtros.' });
    }
});

// Rota para obter nadadores filtrados
router.get('/', async (req, res) => {
    const { ano, prova, categoria } = req.query;
    try {
        // Se ano = "absoluto", buscar melhor tempo entre TODOS os torneios
        if (ano === 'absoluto') {
            const query = `
                SELECT n.nome AS nome_nadador, 
                       c.nome AS categoria, 
                       e.nome AS equipe, 
                       CONCAT(LPAD(r1.minutos, 2, '0'), ':', LPAD(r1.segundos, 2, '0'), '.', LPAD(r1.centesimos, 2, '0')) AS tempo
                FROM (
                    SELECT r.nadadores_id, r.minutos, r.segundos, r.centesimos,
                           ROW_NUMBER() OVER (PARTITION BY r.nadadores_id ORDER BY (r.minutos * 6000 + r.segundos * 100 + r.centesimos) ASC) AS rn
                    FROM records r
                    WHERE (r.minutos * 6000 + r.segundos * 100 + r.centesimos) > 0
                    ${prova ? 'AND r.provas_id = ?' : ''}
                ) r1
                JOIN nadadores n ON r1.nadadores_id = n.id
                JOIN categorias c ON n.categorias_id = c.id
                JOIN equipes e ON n.equipes_id = e.id
                WHERE r1.rn = 1
                ${categoria && categoria !== '*' ? 'AND c.nome = ?' : ''}
                ORDER BY (r1.minutos * 6000 + r1.segundos * 100 + r1.centesimos) ASC
            `;

            const params = (prova ? [prova] : []).concat(categoria && categoria !== '*' ? [categoria] : []);
            const [nadadores] = await db.execute(query, params);
            return res.json(nadadores);
        }

        // Caso contrário, buscar records do ano específico
        const query = `
            SELECT n.nome AS nome_nadador, 
                   c.nome AS categoria, 
                   e.nome AS equipe, 
                   CONCAT(LPAD(r.minutos, 2, '0'), ':', LPAD(r.segundos, 2, '0'), '.', LPAD(r.centesimos, 2, '0')) AS tempo
            FROM records r
            JOIN nadadores n ON r.Nadadores_id = n.id
            JOIN categorias c ON n.categorias_id = c.id
            JOIN equipes e ON n.equipes_id = e.id
            JOIN torneios t ON r.torneios_id = t.id
            WHERE YEAR(t.data_inicio) = ?
            ${prova ? 'AND r.provas_id = ?' : ''}
            ${categoria && categoria !== '*' ? 'AND c.nome = ?' : ''} 
            AND (r.minutos * 6000 + r.segundos * 100 + r.centesimos) > 0
            ORDER BY r.minutos, r.segundos, r.centesimos ASC
        `;

        const params = [ano].concat(prova ? [prova] : []).concat(categoria && categoria !== '*' ? [categoria] : []);
        const [nadadores] = await db.execute(query, params);

        res.json(nadadores);
    } catch (error) {
        console.error('Erro ao buscar nadadores:', error);
        res.status(500).json({ error: 'Erro ao buscar nadadores.' });
    }
});

/**
 * Função para atualizar records individuais e de equipes após salvar resultados de uma prova
 * OTIMIZADO: Só recalcula histórico completo se o evento já foi finalizado
 * @param {number} eventosProvasId - ID da eventos_provas
 */
async function atualizarRecordsPorProva(eventosProvasId) {
    console.log(`[atualizarRecordsPorProva] Iniciando atualização de records para eventos_provas_id: ${eventosProvasId}`);
    
    try {
        // 1. Buscar informações da prova E status do evento
        const [provaInfo] = await db.query(`
            SELECT ep.provas_id, ep.eventos_id, e.torneios_id, p.eh_revezamento, e.classificacao_finalizada
            FROM eventos_provas ep
            JOIN eventos e ON ep.eventos_id = e.id
            JOIN provas p ON ep.provas_id = p.id
            WHERE ep.id = ?
        `, [eventosProvasId]);

        if (!provaInfo || provaInfo.length === 0) {
            console.error(`[atualizarRecordsPorProva] Prova não encontrada para eventos_provas_id: ${eventosProvasId}`);
            return { success: false, message: 'Prova não encontrada' };
        }

        const { provas_id, torneios_id, eh_revezamento, classificacao_finalizada } = provaInfo[0];
        const eventoFinalizado = classificacao_finalizada === 1;

        console.log(`[atualizarRecordsPorProva] Evento finalizado: ${eventoFinalizado ? 'SIM' : 'NÃO'}`);

        if (eventoFinalizado) {
            // 🔹 EVENTO FINALIZADO: Recalcular records considerando TODO o histórico
            return await recalcularRecordsHistorico(provas_id, eh_revezamento);
        } else {
            // 🔹 EVENTO EM ANDAMENTO: Apenas atualizar se for melhor que o record atual
            return await atualizarRecordsAtual(eventosProvasId, provas_id, torneios_id, eh_revezamento);
        }

    } catch (error) {
        console.error(`[atualizarRecordsPorProva] Erro ao atualizar records:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Atualiza records apenas com resultados do evento atual (mais rápido)
 */
async function atualizarRecordsAtual(eventosProvasId, provas_id, torneios_id, eh_revezamento) {
    console.log(`[atualizarRecordsAtual] Atualizando records do evento atual para prova ${provas_id}`);

    if (eh_revezamento) {
        // REVEZAMENTOS
        const [resultadosRevezamento] = await db.query(`
            SELECT r.equipes_id, r.minutos, r.segundos, r.centesimos
            FROM resultados r
            WHERE r.eventos_provas_id = ?
              AND r.equipes_id IS NOT NULL
              AND r.status = 'OK'
            ORDER BY r.minutos ASC, r.segundos ASC, r.centesimos ASC
        `, [eventosProvasId]);

        for (const resultado of resultadosRevezamento) {
            const { equipes_id, minutos, segundos, centesimos } = resultado;
            const tempoAtual = minutos * 6000 + segundos * 100 + centesimos;

            const [recordAtual] = await db.query(`
                SELECT minutos, segundos, centesimos
                FROM recordsEquipes
                WHERE equipes_id = ? AND provas_id = ?
            `, [equipes_id, provas_id]);

            if (recordAtual.length === 0) {
                // Inserir novo record
                await db.query(`
                    INSERT INTO recordsEquipes (equipes_id, provas_id, torneios_id, minutos, segundos, centesimos)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [equipes_id, provas_id, torneios_id, minutos, segundos, centesimos]);
                console.log(`[atualizarRecordsAtual] Novo record de equipe: Equipe ${equipes_id}`);
            } else {
                const recordExistente = recordAtual[0].minutos * 6000 + recordAtual[0].segundos * 100 + recordAtual[0].centesimos;
                
                if (tempoAtual < recordExistente) {
                    await db.query(`
                        UPDATE recordsEquipes
                        SET minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                        WHERE equipes_id = ? AND provas_id = ?
                    `, [minutos, segundos, centesimos, torneios_id, equipes_id, provas_id]);
                    console.log(`[atualizarRecordsAtual] Record de equipe atualizado: Equipe ${equipes_id}`);
                }
            }
        }
    } else {
        // INDIVIDUAIS
        const [resultadosIndividuais] = await db.query(`
            SELECT r.nadadores_id, r.minutos, r.segundos, r.centesimos
            FROM resultados r
            WHERE r.eventos_provas_id = ?
              AND r.nadadores_id IS NOT NULL
              AND r.status = 'OK'
            ORDER BY r.minutos ASC, r.segundos ASC, r.centesimos ASC
        `, [eventosProvasId]);

        for (const resultado of resultadosIndividuais) {
            const { nadadores_id, minutos, segundos, centesimos } = resultado;
            const tempoAtual = minutos * 6000 + segundos * 100 + centesimos;

            const [recordAtual] = await db.query(`
                SELECT minutos, segundos, centesimos
                FROM records
                WHERE nadadores_id = ? AND provas_id = ?
            `, [nadadores_id, provas_id]);

            if (recordAtual.length === 0) {
                await db.query(`
                    INSERT INTO records (nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos]);
                console.log(`[atualizarRecordsAtual] Novo record individual: Nadador ${nadadores_id}`);
            } else {
                const recordExistente = recordAtual[0].minutos * 6000 + recordAtual[0].segundos * 100 + recordAtual[0].centesimos;
                
                if (tempoAtual < recordExistente) {
                    await db.query(`
                        UPDATE records
                        SET minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                        WHERE nadadores_id = ? AND provas_id = ?
                    `, [minutos, segundos, centesimos, torneios_id, nadadores_id, provas_id]);
                    console.log(`[atualizarRecordsAtual] Record individual atualizado: Nadador ${nadadores_id}`);
                }
            }
        }
    }

    return { success: true, message: 'Records atualizados (evento atual)' };
}

/**
 * Recalcula records buscando o melhor tempo de TODOS os eventos (mais lento, só quando finalizado, 
 * vamos usar para garantir que tempos digitados errados de primeira não permaneçam como record)
 */
async function recalcularRecordsHistorico(provas_id, eh_revezamento) {
    console.log(`[recalcularRecordsHistorico] Recalculando TODO o histórico para prova ${provas_id}`);

    if (eh_revezamento) {
        // REVEZAMENTOS - Buscar todas as equipes que participaram desta prova
        const [todasEquipes] = await db.query(`
            SELECT DISTINCT r.equipes_id
            FROM resultados r
            WHERE r.eventos_provas_id IN (
                SELECT ep.id FROM eventos_provas ep WHERE ep.provas_id = ?
            )
            AND r.equipes_id IS NOT NULL
            AND r.status = 'OK'
        `, [provas_id]);

        for (const { equipes_id } of todasEquipes) {
            const [melhorTempo] = await db.query(`
                SELECT r.minutos, r.segundos, r.centesimos, e.torneios_id
                FROM resultados r
                JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
                JOIN eventos e ON ep.eventos_id = e.id
                WHERE ep.provas_id = ? AND r.equipes_id = ? AND r.status = 'OK'
                ORDER BY (r.minutos * 6000 + r.segundos * 100 + r.centesimos) ASC
                LIMIT 1
            `, [provas_id, equipes_id]);

            if (melhorTempo.length === 0) {
                await db.query(`DELETE FROM recordsEquipes WHERE equipes_id = ? AND provas_id = ?`, [equipes_id, provas_id]);
                console.log(`[recalcularRecordsHistorico] Record de equipe removido (sem tempos válidos): Equipe ${equipes_id}`);
            } else {
                const { minutos, segundos, centesimos, torneios_id } = melhorTempo[0];
                await db.query(`
                    INSERT INTO recordsEquipes (equipes_id, provas_id, torneios_id, minutos, segundos, centesimos)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                `, [equipes_id, provas_id, torneios_id, minutos, segundos, centesimos, minutos, segundos, centesimos, torneios_id]);
                console.log(`[recalcularRecordsHistorico] Record de equipe recalculado: Equipe ${equipes_id}`);
            }
        }
    } else {
        // INDIVIDUAIS - Buscar todos os nadadores que participaram desta prova
        const [todosNadadores] = await db.query(`
            SELECT DISTINCT r.nadadores_id
            FROM resultados r
            WHERE r.eventos_provas_id IN (
                SELECT ep.id FROM eventos_provas ep WHERE ep.provas_id = ?
            )
            AND r.nadadores_id IS NOT NULL
            AND r.status = 'OK'
        `, [provas_id]);

        for (const { nadadores_id } of todosNadadores) {
            const [melhorTempo] = await db.query(`
                SELECT r.minutos, r.segundos, r.centesimos, e.torneios_id
                FROM resultados r
                JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
                JOIN eventos e ON ep.eventos_id = e.id
                WHERE ep.provas_id = ? AND r.nadadores_id = ? AND r.status = 'OK'
                ORDER BY (r.minutos * 6000 + r.segundos * 100 + r.centesimos) ASC
                LIMIT 1
            `, [provas_id, nadadores_id]);

            if (melhorTempo.length === 0) {
                await db.query(`DELETE FROM records WHERE nadadores_id = ? AND provas_id = ?`, [nadadores_id, provas_id]);
                console.log(`[recalcularRecordsHistorico] Record individual removido (sem tempos válidos): Nadador ${nadadores_id}`);
            } else {
                const { minutos, segundos, centesimos, torneios_id } = melhorTempo[0];
                await db.query(`
                    INSERT INTO records (nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                `, [nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos, minutos, segundos, centesimos, torneios_id]);
                console.log(`[recalcularRecordsHistorico] Record individual recalculado: Nadador ${nadadores_id}`);
            }
        }
    }

    return { success: true, message: 'Records recalculados (histórico completo)' };
}

// Exportar função para uso em outras rotas
router.atualizarRecordsPorProva = atualizarRecordsPorProva;
module.exports = router;