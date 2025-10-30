const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para obter filtros (provas e categorias)
router.get('/filtros', async (req, res) => {
    const { ano } = req.query;
    try {
        const [provas] = await db.execute(
            `SELECT DISTINCT p.id, CONCAT(p.distancia, 'm ', p.estilo) AS prova, p.sexo
             FROM records r
             JOIN provas p ON r.provas_id = p.id
             JOIN torneios t ON r.torneios_id = t.id
             WHERE YEAR(t.data_inicio) = ?`,
            [ano]
        );

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
 * @param {number} eventosProvasId - ID da eventos_provas
 */
async function atualizarRecordsPorProva(eventosProvasId) {
    console.log(`[atualizarRecordsPorProva] Iniciando atualização de records para eventos_provas_id: ${eventosProvasId}`);
    
    try {
        // 1. Buscar informações da prova
        const [provaInfo] = await db.query(`
            SELECT ep.provas_id, ep.eventos_id, e.torneios_id, p.eh_revezamento
            FROM eventos_provas ep
            JOIN eventos e ON ep.eventos_id = e.id
            JOIN provas p ON ep.provas_id = p.id
            WHERE ep.id = ?
        `, [eventosProvasId]);

        if (!provaInfo || provaInfo.length === 0) {
            console.error(`[atualizarRecordsPorProva] Prova não encontrada para eventos_provas_id: ${eventosProvasId}`);
            return { success: false, message: 'Prova não encontrada' };
        }

        const { provas_id, torneios_id, eh_revezamento } = provaInfo[0];

        if (eh_revezamento) {
            // 2A. ATUALIZAR RECORDS DE REVEZAMENTO (recordsEquipes)
            console.log(`[atualizarRecordsPorProva] Atualizando records de REVEZAMENTO para prova ${provas_id}`);
            
            // Buscar resultados de revezamento da prova com status OK
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

                // Verificar se já existe record para esta equipe nesta prova
                const [recordAtual] = await db.query(`
                    SELECT minutos, segundos, centesimos
                    FROM recordsEquipes
                    WHERE equipes_id = ? AND provas_id = ?
                `, [equipes_id, provas_id]);

                const tempoAtual = minutos * 6000 + segundos * 100 + centesimos;

                if (recordAtual.length === 0) {
                    // Inserir novo record de equipe
                    await db.query(`
                        INSERT INTO recordsEquipes (equipes_id, provas_id, torneios_id, minutos, segundos, centesimos)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [equipes_id, provas_id, torneios_id, minutos, segundos, centesimos]);
                    console.log(`[atualizarRecordsPorProva] Novo record de equipe inserido: Equipe ${equipes_id}, Prova ${provas_id}`);
                } else {
                    // Comparar com record existente
                    const recordExistente = recordAtual[0].minutos * 6000 + recordAtual[0].segundos * 100 + recordAtual[0].centesimos;
                    
                    if (tempoAtual < recordExistente) {
                        // Atualizar record de equipe
                        await db.query(`
                            UPDATE recordsEquipes
                            SET minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                            WHERE equipes_id = ? AND provas_id = ?
                        `, [minutos, segundos, centesimos, torneios_id, equipes_id, provas_id]);
                        console.log(`[atualizarRecordsPorProva] Record de equipe atualizado: Equipe ${equipes_id}, Prova ${provas_id}`);
                    }
                }
            }
        } else {
            // 2B. ATUALIZAR RECORDS INDIVIDUAIS (records)
            console.log(`[atualizarRecordsPorProva] Atualizando records INDIVIDUAIS para prova ${provas_id}`);
            
            // Buscar resultados individuais da prova com status OK
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

                // Verificar se já existe record para este nadador nesta prova
                const [recordAtual] = await db.query(`
                    SELECT minutos, segundos, centesimos
                    FROM records
                    WHERE nadadores_id = ? AND provas_id = ?
                `, [nadadores_id, provas_id]);

                const tempoAtual = minutos * 6000 + segundos * 100 + centesimos;

                if (recordAtual.length === 0) {
                    // Inserir novo record individual
                    await db.query(`
                        INSERT INTO records (nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [nadadores_id, provas_id, torneios_id, minutos, segundos, centesimos]);
                    console.log(`[atualizarRecordsPorProva] Novo record individual inserido: Nadador ${nadadores_id}, Prova ${provas_id}`);
                } else {
                    // Comparar com record existente
                    const recordExistente = recordAtual[0].minutos * 6000 + recordAtual[0].segundos * 100 + recordAtual[0].centesimos;
                    
                    if (tempoAtual < recordExistente) {
                        // Atualizar record individual
                        await db.query(`
                            UPDATE records
                            SET minutos = ?, segundos = ?, centesimos = ?, torneios_id = ?
                            WHERE nadadores_id = ? AND provas_id = ?
                        `, [minutos, segundos, centesimos, torneios_id, nadadores_id, provas_id]);
                        console.log(`[atualizarRecordsPorProva] Record individual atualizado: Nadador ${nadadores_id}, Prova ${provas_id}`);
                    }
                }
            }
        }

        console.log(`[atualizarRecordsPorProva] Atualização de records concluída para eventos_provas_id: ${eventosProvasId}`);
        return { success: true, message: 'Records atualizados com sucesso' };
    } catch (error) {
        console.error(`[atualizarRecordsPorProva] Erro ao atualizar records:`, error);
        return { success: false, message: error.message };
    }
}

// Exportar função para uso em outras rotas
router.atualizarRecordsPorProva = atualizarRecordsPorProva;
module.exports = router;