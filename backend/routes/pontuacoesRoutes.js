const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { classificarProva } = require('./resultadosRoutes'); 

/*
**
** calcularPontuacaoEvento: Função para calcular e armazenar a pontuação de um evento
** pontuarEvento: Rota para processar a pontuação de um evento
**
*/

// Tabela de pontuação individual e revezamento
const PONTOS_INDIVIDUAL = [9, 7, 6, 5, 4, 3, 2, 1];
const PONTOS_REVEZAMENTO = [18, 14, 12, 10, 8, 6, 4, 2];

// Função utilitária para converter tempo em centésimos
function tempoParaCentesimo(tempo) {
  if (!tempo || tempo === 'NC' || tempo === 'DQL') return null;
  const [min, seg, cent] = tempo.split(':').map(Number);
  return min * 6000 + seg * 100 + cent;
}

// Função para atribuir pontuação considerando empates reais (por tempo em centésimos)
function atribuirPontuacao(classificacoes, tabelaPontuacao, campoTempo = 'tempo') {
  // Filtra apenas status OK e tempo válido
  const validos = classificacoes.filter(row => row.status === 'OK' && row[campoTempo] && row[campoTempo] !== 'NC' && row[campoTempo] !== 'DQL')
    .map(row => ({ ...row, tempoCentesimos: tempoParaCentesimo(row[campoTempo]) }))
    .sort((a, b) => a.tempoCentesimos - b.tempoCentesimos);

  let i = 0;
  let premiados = [];
  let posicao = 0;
  while (i < validos.length && posicao < tabelaPontuacao.length) {
    const empatados = [validos[i]];
    let j = i + 1;
    while (
      j < validos.length &&
      validos[j].tempoCentesimos === validos[i].tempoCentesimos
    ) {
      empatados.push(validos[j]);
      j++;
    }
    // Só atribui pontuação se ainda houver posições premiadas
    if (posicao < tabelaPontuacao.length) {
      let somaPontuacao = 0;
      for (let k = 0; k < empatados.length; k++) {
        somaPontuacao += tabelaPontuacao[posicao + k] || 0;
      }
      const mediaPontuacao = somaPontuacao / empatados.length;
      for (const emp of empatados) {
        emp.pontuacao = mediaPontuacao;
        premiados.push({ id: emp.id, pontuacao: emp.pontuacao });
      }
      posicao += empatados.length;
    }
    i += empatados.length;
  }
  return premiados;
}


// Função para calcular e armazenar a pontuação no evento, com logs detalhados
const calcularPontuacaoEvento = async (eventosId) => {
  try {
    console.log(`[pontuacoesRoutes] Iniciando cálculo de pontuação para evento ${eventosId}`);
    const [provasEvento] = await db.execute(
      `SELECT ep.id AS evento_prova_id, p.eh_revezamento, p.eh_prova_ouro, p.eh_prova_categoria, p.eh_prova_festival,
              p.estilo, p.distancia, p.sexo
       FROM eventos_provas ep 
       JOIN provas p ON ep.provas_id = p.id 
       WHERE ep.eventos_id = ?`,
      [eventosId]
    );
    if (provasEvento.length === 0) {
      console.log(`[pontuacoesRoutes] Nenhuma prova encontrada para o evento ${eventosId}`);
      return { error: "Nenhuma prova encontrada para este evento." };
    }

    // Zerar todas as pontuações primeiro
    await db.execute(
      `UPDATE classificacoes c
       JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
       SET c.pontuacao_individual = 0, c.pontuacao_equipe = 0
       WHERE ep.eventos_id = ?`,
      [eventosId]
    );

    for (const prova of provasEvento) {
      // Garante que a classificação existe para esta prova
      await classificarProva(prova.evento_prova_id);

      const nomeProva = `${prova.estilo} ${prova.distancia} ${prova.sexo}`;
      
      if (prova.eh_revezamento) {
        // Revezamentos: pontuação dobrada (18, 14, 12...)
        const [classificacoes] = await db.execute(
          `SELECT c.id, c.nadadores_id, c.equipes_id, c.classificacao, n.categorias_id, cat.eh_mirim, c.tipo, c.status, c.tempo
           FROM classificacoes c
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ? 
           AND c.status = 'OK'
           AND c.classificacao BETWEEN 1 AND 8
           ORDER BY c.classificacao ASC`,
          [prova.evento_prova_id]
        );
        
        // EQUIPE: todos os revezamentos pontuam para a equipe (pontuação dobrada)
        const pontuadosEquipe = atribuirPontuacao(classificacoes, PONTOS_REVEZAMENTO, 'tempo');
        if (pontuadosEquipe.length > 0) {
          const equipeUpdates = pontuadosEquipe.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
          const idsEquipe = pontuadosEquipe.map(row => row.id);
          await db.execute(
            `UPDATE classificacoes SET pontuacao_equipe = CASE id ${equipeUpdates.join(' ')} END WHERE id IN (${idsEquipe.join(',')})`
          );
        }
        
        // INDIVIDUAL: revezamentos sempre pontuam individualmente (pontuação dobrada)
        const pontuadosInd = atribuirPontuacao(classificacoes, PONTOS_REVEZAMENTO, 'tempo');
        if (pontuadosInd.length > 0) {
          const indUpdates = pontuadosInd.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
          const idsInd = pontuadosInd.map(row => row.id);
          await db.execute(
            `UPDATE classificacoes SET pontuacao_individual = CASE id ${indUpdates.join(' ')} END WHERE id IN (${idsInd.join(',')})`
          );
        }
        
      } else if (prova.eh_prova_categoria) {
        // Provas de Categoria: só Mirim pontua individual e equipe
        // Buscar todos Mirins por categoria, agrupando corretamente
        const [classificacoes] = await db.execute(
          `SELECT c.id, n.categorias_id, cat.eh_mirim, cat.nome AS categoria_nome, c.tempo, c.tipo, c.status
           FROM classificacoes c
           JOIN resultados r
             ON r.eventos_provas_id = c.eventos_provas_id
            AND r.nadadores_id = c.nadadores_id
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ?
           AND c.tipo = 'CATEGORIA'
           AND c.status = 'OK'
           AND r.conta_pontuacao = 1
           AND cat.eh_mirim = 1
           ORDER BY cat.nome ASC, c.tempo ASC`,
          [prova.evento_prova_id]
        );
        // Agrupa por categoria Mirim
        const categoriasMirim = [...new Set(classificacoes.map(row => row.categoria_nome))];
        let pontuadosMirim = [];
        for (const categoria of categoriasMirim) {
          const atletasCategoria = classificacoes.filter(row => row.categoria_nome === categoria);
          // Ordena por tempo (posição real na categoria)
          atletasCategoria.sort((a, b) => tempoParaCentesimo(a.tempo) - tempoParaCentesimo(b.tempo));
          // Atribui pontuação conforme posição real (até 8)
          pontuadosMirim = pontuadosMirim.concat(
            atletasCategoria.slice(0, 8).map((row, idx) => ({
              id: row.id,
              pontuacao: PONTOS_INDIVIDUAL[idx] || 0
            }))
          );
        }
        if (pontuadosMirim.length > 0) {
          const updates = pontuadosMirim.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
          const ids = pontuadosMirim.map(row => row.id);
          await db.execute(
            `UPDATE classificacoes 
               SET pontuacao_individual = CASE id ${updates.join(' ')} END,
                   pontuacao_equipe     = CASE id ${updates.join(' ')} END
             WHERE id IN (${ids.join(',')})`
          );
        }

        // sincroniza pontuação_individual do registro CATEGORIA para o ABSOLUTO (NÃO sincroniza pontuacao_equipe!)
        await db.execute(
          `UPDATE classificacoes cat
             JOIN classificacoes abs 
               ON cat.eventos_provas_id = abs.eventos_provas_id
              AND cat.nadadores_id      = abs.nadadores_id
              AND abs.tipo             = 'ABSOLUTO'
           SET abs.pontuacao_individual = cat.pontuacao_individual
           WHERE cat.eventos_provas_id = ?
             AND cat.tipo = 'CATEGORIA'
             AND cat.pontuacao_individual > 0`,
          [prova.evento_prova_id]
        );
      } else if (prova.eh_prova_ouro) {
        // Provas Ouro: só Petiz+ pontua individual, TODOS pontuam para equipe

        // Busca classificações ABSOLUTO para pontuação de equipe (apenas os 8 primeiros)
        const [classificacoesEquipe] = await db.execute(
          `SELECT c.id, n.categorias_id, cat.eh_mirim, cat.nome AS categoria_nome, c.tempo, c.status, c.classificacao, c.tipo
           FROM classificacoes c
           JOIN resultados r
             ON r.eventos_provas_id = c.eventos_provas_id
            AND r.nadadores_id = c.nadadores_id
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ?
           AND c.tipo = 'ABSOLUTO'
           AND c.status = 'OK'
           AND r.conta_pontuacao = 1
           AND c.classificacao BETWEEN 1 AND 8
           ORDER BY c.classificacao ASC`,
          [prova.evento_prova_id]
        );
        // EQUIPE: todos pontuam para a equipe em provas ouro (posição absoluta)
        const pontuadosEquipe = atribuirPontuacao(classificacoesEquipe, PONTOS_INDIVIDUAL, 'tempo');
        if (pontuadosEquipe.length > 0) {
          const equipeUpdates = pontuadosEquipe.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
          const idsEquipe = pontuadosEquipe.map(row => row.id);
          await db.execute(
            `UPDATE classificacoes SET pontuacao_equipe = CASE id ${equipeUpdates.join(' ')} END WHERE id IN (${idsEquipe.join(',')})`
          );
        }

        // Pontuação individual: Mirins recebem a pontuação que receberam na categoria
        // Busca todos Mirins absolutos e sincroniza pontuacao_individual do registro CATEGORIA
        const [mirinsAbsoluto] = await db.execute(
          `SELECT c.id, c.nadadores_id, c.eventos_provas_id
           FROM classificacoes c
           JOIN resultados r
             ON r.eventos_provas_id = c.eventos_provas_id
            AND r.nadadores_id = c.nadadores_id
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ?
           AND c.tipo = 'ABSOLUTO'
           AND c.status = 'OK'
           AND r.conta_pontuacao = 1
           AND cat.eh_mirim = 1`,
          [prova.evento_prova_id]
        );
        if (mirinsAbsoluto.length > 0) {
          // Busca todos registros de categoria para esse eventos_provas_id
          const [mirinsCategoria] = await db.execute(
            `SELECT nadadores_id, pontuacao_individual FROM classificacoes
             WHERE eventos_provas_id = ? AND tipo = 'CATEGORIA'`,
            [prova.evento_prova_id]
          );
          // Cria um mapa nadadores_id -> pontuacao_individual
          const pontuacaoPorNadador = {};
          for (const cat of mirinsCategoria) {
            pontuacaoPorNadador[cat.nadadores_id] = cat.pontuacao_individual;
          }
          // Atualiza todos mirins absolutos com a pontuação da categoria
          for (const abs of mirinsAbsoluto) {
            const pontos = pontuacaoPorNadador[abs.nadadores_id] || 0;
            await db.execute(
              `UPDATE classificacoes SET pontuacao_individual = ? WHERE id = ?`,
              [pontos, abs.id]
            );
          }
        }

        // Busca todos Petiz+ para pontuação individual (sem limitar por classificação absoluta)
        const [classificacoesInd] = await db.execute(
          `SELECT c.id, n.categorias_id, cat.eh_mirim, c.tempo, c.status, c.classificacao, c.tipo
           FROM classificacoes c
           JOIN resultados r
             ON r.eventos_provas_id = c.eventos_provas_id
            AND r.nadadores_id = c.nadadores_id
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ?
           AND c.tipo = 'ABSOLUTO'
           AND c.status = 'OK'
           AND r.conta_pontuacao = 1
           AND cat.eh_mirim <> 1
           ORDER BY n.categorias_id, c.classificacao ASC`,
          [prova.evento_prova_id]
        );
        // Agrupa por categoria e atribui pontuação por posição na categoria (até 8 por categoria)
        let pontuadosInd = [];
        const categoriasPetizMais = [...new Set(classificacoesInd.map(row => row.categorias_id))];
        for (const categoriaId of categoriasPetizMais) {
          const atletasCategoria = classificacoesInd.filter(row => row.categorias_id === categoriaId);
          const pontuadosCat = atribuirPontuacao(atletasCategoria, PONTOS_INDIVIDUAL, 'tempo');
          pontuadosInd = pontuadosInd.concat(pontuadosCat);
        }
        if (pontuadosInd.length > 0) {
          const indUpdates = pontuadosInd.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
          const idsInd = pontuadosInd.map(row => row.id);
          await db.execute(
            `UPDATE classificacoes SET pontuacao_individual = CASE id ${indUpdates.join(' ')} END WHERE id IN (${idsInd.join(',')})`
          );
        }
      } else if (prova.eh_prova_festival) {
        // Provas Festival: NÃO pontuam
        console.log(`[pontuacoesRoutes] Festival "${nomeProva}" - Prova festival não pontua, pulando...`);
        
      } else {
        console.log(`[pontuacoesRoutes] ATENÇÃO: Prova "${nomeProva}" (ID: ${prova.evento_prova_id}) não está marcada com nenhum tipo específico. Assumindo como OURO.`);
        
        // Se não está marcada como nenhuma, assumir que é OURO
        const [classificacoes] = await db.execute(
          `SELECT c.id, n.categorias_id, cat.eh_mirim, c.tempo, c.status, c.classificacao, c.tipo
           FROM classificacoes c
           JOIN resultados r
             ON r.eventos_provas_id = c.eventos_provas_id
            AND r.nadadores_id = c.nadadores_id
           LEFT JOIN nadadores n ON c.nadadores_id = n.id
           LEFT JOIN categorias cat ON n.categorias_id = cat.id
           WHERE c.eventos_provas_id = ?
           AND c.tipo = 'ABSOLUTO'
           AND c.status = 'OK'
           AND r.conta_pontuacao = 1
           AND c.classificacao BETWEEN 1 AND 8
           ORDER BY c.classificacao ASC`,
          [prova.evento_prova_id]
        );
        
        if (classificacoes.length > 0) {
          
          // EQUIPE: todos pontuam para a equipe em provas ouro
          const pontuadosEquipe = atribuirPontuacao(classificacoes, PONTOS_INDIVIDUAL, 'tempo');
          if (pontuadosEquipe.length > 0) {
            const equipeUpdates = pontuadosEquipe.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
            const idsEquipe = pontuadosEquipe.map(row => row.id);
            await db.execute(
              `UPDATE classificacoes SET pontuacao_equipe = CASE id ${equipeUpdates.join(' ')} END WHERE id IN (${idsEquipe.join(',')})`
            );
          }
          
          // INDIVIDUAL: só Petiz+ (não Mirim) pontua individualmente em provas ouro
          const petizMais = classificacoes.filter(row => row.eh_mirim !== 1);
          
          const pontuadosInd = atribuirPontuacao(petizMais, PONTOS_INDIVIDUAL, 'tempo');
          if (pontuadosInd.length > 0) {
            const indUpdates = pontuadosInd.map(row => `WHEN ${row.id} THEN ${row.pontuacao}`);
            const idsInd = pontuadosInd.map(row => row.id);
            await db.execute(
              `UPDATE classificacoes SET pontuacao_individual = CASE id ${indUpdates.join(' ')} END WHERE id IN (${idsInd.join(',')})`
            );
          }
        }
      }
    }
    // Fim do cálculo de pontuação para evento
    console.log(`[pontuacoesRoutes] Fim do cálculo de pontuação para evento ${eventosId}`);

    // Cálculo do ranking de equipes mirins (centralizado aqui)
    const [rankingMirim] = await db.execute(`
      SELECT 
        e.id AS equipes_id,
        e.nome AS equipe_nome,
        SUM(r.pontos) AS pontos
      FROM rankingEquipesMirim r
      JOIN equipes e ON r.equipes_id = e.id
      WHERE r.eventos_id = ?
      GROUP BY e.id, e.nome
      HAVING pontos > 0
      ORDER BY pontos DESC
    `, [eventosId]);
/* 
    // <-- SINCRONIZA RANKING MIRIM NA TABELA rankingEquipesMirim -->
    await db.execute(`DELETE FROM rankingEquipesMirim WHERE eventos_id = ?`, [eventosId]);
    await db.execute(`
      INSERT INTO rankingEquipesMirim (
        torneios_id,
        eventos_id,
        equipes_id,
        pontos
      )
      SELECT 
        3 AS torneios_id,
        ep.eventos_id,
        c.equipes_id,
        SUM(c.pontuacao_equipe) AS pontos
      FROM classificacoes c
      JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
      WHERE ep.eventos_id = ?
        AND c.tipo = 'CATEGORIA'
        AND c.pontuacao_equipe > 0
      GROUP BY ep.eventos_id, c.equipes_id
    `, [eventosId]); */

    // Retorna resultado da pontuação + ranking mirim juntos
    return {
      success: "Pontuação do evento calculada e armazenada com sucesso!",
      rankingMirim
    };
  } catch (error) {
    console.error('[pontuacoesRoutes] Erro ao calcular pontuação:', error);
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

// Endpoint para consultar ranking de equipes mirins por evento

module.exports = {
    router,
    calcularPontuacaoEvento, // Exporta a função para calcular a pontuação em outros módulos
};
