const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Tabela de pontuação individual
const PONTOS_INDIVIDUAL = [9, 7, 6, 5, 4, 3, 2, 1];
// Tabela de pontuação de revezamento (dobro da individual)
const PONTOS_REVEZAMENTO = [18, 14, 12, 10, 8, 6, 4, 2];

// Função para calcular e armazenar a pontuação no evento
const calcularPontuacaoEvento = async (eventosId) => {
    try {
        // 1. Buscar todas as provas do evento
        const [provasEvento] = await db.execute(
            "SELECT ep.id AS evento_prova_id, p.* FROM eventos_provas ep JOIN provas p ON ep.provas_id = p.id WHERE ep.eventos_id = ?",
            [eventosId]
        );

        if (provasEvento.length === 0) return { error: "Nenhuma prova encontrada para este evento." };

        // 2. Para cada prova, buscar a classificação já ordenada da tabela `classificacoes`
        for (const prova of provasEvento) {
            const [classificacoes] = await db.execute(
                `SELECT id, nadadores_id, equipes_id, classificacao 
                 FROM classificacoes
                 WHERE eventos_provas_id = ? 
                 AND classificacao BETWEEN 1 AND 8`, // Apenas os 8 primeiros pontuam
                [prova.evento_prova_id]
            );

            // 3. Aplicar pontuação e atualizar a tabela `classificacoes`
            for (const classificacao of classificacoes) {
                const colocacao = classificacao.classificacao;
                let pontuacao_individual = 0;
                let pontuacao_equipe = 0;

                if (prova.eh_revezamento) {
                    // 🚀 REVEZAMENTO: Apenas pontuação para equipe (dobrada)
                    pontuacao_equipe = PONTOS_REVEZAMENTO[colocacao - 1];
                } else {
                    if (prova.eh_prova_categoria) {
                        // ✅ Prova de categoria: Apenas pontuação individual
                        pontuacao_individual = PONTOS_INDIVIDUAL[colocacao - 1];
                    } else if (prova.eh_prova_ouro) {
                        // ✅ Prova Ouro: Pontuação individual + pontuação para equipe
                        pontuacao_individual = PONTOS_INDIVIDUAL[colocacao - 1];
                        pontuacao_equipe = PONTOS_INDIVIDUAL[colocacao - 1];
                    }
                }

                // 4. Atualizar apenas se houver pontuação válida
                if (pontuacao_individual > 0 || pontuacao_equipe > 0) {
                    await db.execute(
                        `UPDATE classificacoes 
                         SET pontuacao_individual = ?, pontuacao_equipe = ? 
                         WHERE id = ?`,
                        [pontuacao_individual, pontuacao_equipe, classificacao.id]
                    );
                }
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
