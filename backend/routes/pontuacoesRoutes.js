const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Tabela de pontuação individual e revezamento
const PONTOS_INDIVIDUAL = [9, 7, 6, 5, 4, 3, 2, 1];
const PONTOS_REVEZAMENTO = [18, 14, 12, 10, 8, 6, 4, 2];

// Função para calcular e armazenar a pontuação no evento
const calcularPontuacaoEvento = async (eventosId) => {
    try {
        const [provasEvento] = await db.execute(
            `SELECT ep.id AS evento_prova_id, p.eh_revezamento, p.eh_prova_ouro, p.eh_prova_categoria 
             FROM eventos_provas ep 
             JOIN provas p ON ep.provas_id = p.id 
             WHERE ep.eventos_id = ?`,
            [eventosId]
        );

        if (provasEvento.length === 0) return { error: "Nenhuma prova encontrada para este evento." };

        for (const prova of provasEvento) {
            let classificacoes;
            if (prova.eh_revezamento) {
                [classificacoes] = await db.execute(
                    `SELECT c.id, c.nadadores_id, c.equipes_id, c.classificacao, n.categorias_id, c.tipo
                     FROM classificacoes c
                     LEFT JOIN nadadores n ON c.nadadores_id = n.id
                     WHERE c.eventos_provas_id = ? 
                     AND c.classificacao BETWEEN 1 AND 8
                     ORDER BY c.classificacao ASC`,
                    [prova.evento_prova_id]
                );
                // Atualiza pontuação de equipes para revezamento
                for (const classificacao of classificacoes) {
                    const pontuacao_equipe = PONTOS_REVEZAMENTO[classificacao.classificacao - 1] || 0;
                    if (pontuacao_equipe > 0) {
                        await db.execute(
                            `UPDATE classificacoes 
                             SET pontuacao_equipe = ? 
                             WHERE id = ?`,
                            [pontuacao_equipe, classificacao.id]
                        );
                    }
                }
            } else {
                // NOVA LÓGICA: Obter classificações ordenadas por categoria semelhante à classificação por categoria dos resultados
                [classificacoes] = await db.execute(
                    `SELECT c.id, n.categorias_id, c.classificacao 
                     FROM classificacoes c
                     LEFT JOIN nadadores n ON c.nadadores_id = n.id
                     WHERE c.eventos_provas_id = ?
                     ORDER BY n.categorias_id ASC, 
                              CASE WHEN c.status IN ('DQL', 'NC') THEN 1 ELSE 0 END, 
                              c.classificacao ASC`,
                    [prova.evento_prova_id]
                );
                // Agrupar por categoria para pontuação individual
                const categorias = {};
                classificacoes.forEach((row) => {
                    if (!categorias[row.categorias_id]) {
                        categorias[row.categorias_id] = [];
                    }
                    categorias[row.categorias_id].push(row);
                });
                // Atualiza pontuação individual conforme ranking por categoria
                for (const cat in categorias) {
                    categorias[cat].forEach(async (row, index) => {
                        let pontuacao_individual = 0;
                        if (prova.eh_prova_categoria || prova.eh_prova_ouro) {
                            pontuacao_individual = PONTOS_INDIVIDUAL[index] || 0;
                        }
                        if (pontuacao_individual > 0) {
                            await db.execute(
                                `UPDATE classificacoes 
                                 SET pontuacao_individual = ? 
                                 WHERE id = ?`,
                                [pontuacao_individual, row.id]
                            );
                        }
                    });
                }
                // Atualiza pontuação da equipe utilizando o ranking absoluto geral para provas individuais
                [classificacoes] = await db.execute(
                    `SELECT c.id, c.classificacao 
                     FROM classificacoes c
                     WHERE c.eventos_provas_id = ?
                     ORDER BY c.classificacao ASC`,
                    [prova.evento_prova_id]
                );
                classificacoes.forEach(async (row, index) => {
                    const pontuacao_equipe = PONTOS_INDIVIDUAL[index] || 0;
                    if (pontuacao_equipe > 0) {
                        await db.execute(
                            `UPDATE classificacoes 
                             SET pontuacao_equipe = ? 
                             WHERE id = ?`,
                            [pontuacao_equipe, row.id]
                        );
                    }
                });
            }
        }

        return { success: "Pontuação do evento calculada e armazenada com sucesso!" };
    } catch (error) {
        console.error(error);
        return { error: "Erro ao calcular pontuação do evento." };
    }
};

// Rota para processar a pontuação de um evento
router.post('/pontuar-evento/:eventoId', async (req, res) => {
    try {
        const { eventoId } = req.params;

        if (!eventoId) {
            return res.status(400).json({ error: "O ID do evento é obrigatório!" });
        }

        const resultado = await calcularPontuacaoEvento(eventoId);

        res.status(200).json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar a pontuação." });
    }
});

module.exports = router;
