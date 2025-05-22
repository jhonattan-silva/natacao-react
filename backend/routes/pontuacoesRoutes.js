const express = require('express');
const router = express.Router();
const db = require('../config/db');

/*
**
** calcularPontuacaoEvento: Função para calcular e armazenar a pontuação de um evento
** pontuarEvento: Rota para processar a pontuação de um evento
**
*/

// Tabela de pontuação individual e revezamento
const PONTOS_INDIVIDUAL = [9, 7, 6, 5, 4, 3, 2, 1];
const PONTOS_REVEZAMENTO = [18, 14, 12, 10, 8, 6, 4, 2];

// Função para distribuir pontuação considerando empates
function distribuirPontuacaoComEmpate(classificacoes, tabelaPontuacao, campoTempo = 'tempo') {
    let i = 0;
    while (i < classificacoes.length) {
        // Identifica todos os empatados nesta posição
        const empatados = [classificacoes[i]];
        let j = i + 1;
        while (
            j < classificacoes.length &&
            classificacoes[j][campoTempo] === classificacoes[i][campoTempo]
        ) {
            empatados.push(classificacoes[j]);
            j++;
        }

        // Soma as pontuações das posições empatadas e divide pelo número de empatados
        let somaPontuacao = 0;
        for (let k = 0; k < empatados.length; k++) {
            somaPontuacao += tabelaPontuacao[i + k] || 0;
        }
        const mediaPontuacao = somaPontuacao / empatados.length;

        // Atribui a média para todos os empatados
        for (const emp of empatados) {
            emp.pontuacao = mediaPontuacao;
        }

        i += empatados.length; // Pula para a próxima posição após os empatados
    }
    return classificacoes;
}

// Função para calcular e armazenar a pontuação no evento
const calcularPontuacaoEvento = async (eventosId) => {
    try {
        const [provasEvento] = await db.execute( // Obter provas do evento
            `SELECT ep.id AS evento_prova_id, p.eh_revezamento, p.eh_prova_ouro, p.eh_prova_categoria 
             FROM eventos_provas ep 
             JOIN provas p ON ep.provas_id = p.id 
             WHERE ep.eventos_id = ?`,
            [eventosId]
        );

        if (provasEvento.length === 0) return { error: "Nenhuma prova encontrada para este evento." };

        for (const prova of provasEvento) { // Obter cada prova do evento
            if (!prova.eh_prova_ouro) {
                continue; // Pula para a próxima prova
            }
            let classificacoes;
            if (prova.eh_revezamento) {
                [classificacoes] = await db.execute( // Obter classificações de revezamento
                    `SELECT c.id, c.nadadores_id, c.equipes_id, c.classificacao, n.categorias_id, c.tipo
                     FROM classificacoes c
                     LEFT JOIN nadadores n ON c.nadadores_id = n.id
                     WHERE c.eventos_provas_id = ? 
                     AND c.classificacao BETWEEN 1 AND 8
                     AND c.status = 'OK'
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
                // Obter classificações ordenadas por categoria semelhante à classificação por categoria dos resultados
                [classificacoes] = await db.execute(
                    `SELECT c.id, n.categorias_id, cat.eh_mirim, c.classificacao, c.tempo
                     FROM classificacoes c
                     LEFT JOIN nadadores n ON c.nadadores_id = n.id
                     LEFT JOIN categorias cat ON n.categorias_id = cat.id
                     WHERE c.eventos_provas_id = ?
                     AND c.status = 'OK'
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
                    // Ordene por tempo/classificação se necessário
                    const lista = categorias[cat]
                        .filter(row => row.tempo !== 'NC' && row.tempo !== 'DQL')
                        .slice()
                        .sort((a, b) => a.tempo.localeCompare(b.tempo))
                        .slice(0, 8);
                    // Aplique a função de empate
                    const classificados = distribuirPontuacaoComEmpate(lista, PONTOS_INDIVIDUAL, 'tempo');
                    for (const row of classificados) {
                        // Regra: mirim só pontua em prova de categoria, não-mirim só pontua em prova ouro
                        if ((row.eh_mirim && prova.eh_prova_categoria) ||
                            (!row.eh_mirim && prova.eh_prova_ouro)) {
                            if (row.pontuacao > 0) {
                                await db.execute(
                                    `UPDATE classificacoes SET pontuacao_individual = ? WHERE id = ?`,
                                    [row.pontuacao, row.id]
                                );
                            }
                        }
                    }
                }
                // Buscar o ranking absoluto da prova
                const [absoluto] = await db.execute(
                    `SELECT c.id, c.tempo
                     FROM classificacoes c
                     WHERE c.eventos_provas_id = ?
                     AND c.status = 'OK'
                     AND c.tipo = 'ABSOLUTO'
                     ORDER BY c.classificacao ASC
                     LIMIT 8`,
                    [prova.evento_prova_id]
                );

                const classificadosEquipe = distribuirPontuacaoComEmpate(absoluto, PONTOS_INDIVIDUAL);
                for (const row of classificadosEquipe) {
                    if (row.pontuacao > 0) {
                        await db.execute(
                            `UPDATE classificacoes SET pontuacao_equipe = ? WHERE id = ?`,
                            [row.pontuacao, row.id]
                        );
                    }
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

module.exports = {
    router,
    calcularPontuacaoEvento, // Exporta a função para calcular a pontuação em outros módulos
};
