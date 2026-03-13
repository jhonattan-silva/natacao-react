const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const RELATORIOS_POS_PROVA_DIR = path.join(__dirname, '..', 'uploads', 'relatorios', 'pos-prova');

function garantirDiretorioRelatorios() {
  if (!fs.existsSync(RELATORIOS_POS_PROVA_DIR)) {
    fs.mkdirSync(RELATORIOS_POS_PROVA_DIR, { recursive: true });
  }
}

function tempoParaCentesimos(minutos, segundos, centesimos, tempo) {
  if (Number.isInteger(minutos) && Number.isInteger(segundos) && Number.isInteger(centesimos)) {
    return minutos * 6000 + segundos * 100 + centesimos;
  }

  if (!tempo || tempo === 'NC' || tempo === 'DQL') return null;
  const [min, seg, cent] = String(tempo).split(':').map(Number);
  if ([min, seg, cent].some(Number.isNaN)) return null;
  return min * 6000 + seg * 100 + cent;
}

function formatarTempo(centesimosTotais) {
  if (centesimosTotais === null || centesimosTotais === undefined) return '-';
  const sinal = centesimosTotais < 0 ? '-' : centesimosTotais > 0 ? '+' : '';
  const valor = Math.abs(Number(centesimosTotais));
  const minutos = Math.floor(valor / 6000);
  const segundos = Math.floor((valor % 6000) / 100);
  const centesimos = valor % 100;
  return `${sinal}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
}

function normalizarNomeArquivo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function buscarEventoBase(eventoId, ano) {
  if (eventoId) {
    const [eventoById] = await db.query(
      `SELECT id, nome, data, cidade, sede
       FROM eventos
       WHERE id = ?
       LIMIT 1`,
      [eventoId]
    );
    return eventoById[0] || null;
  }

  if (ano) {
    const [eventoPorAno] = await db.query(
      `SELECT id, nome, data, cidade, sede
       FROM eventos
       WHERE YEAR(data) = ?
         AND teve_resultados = 1
       ORDER BY data DESC, id DESC
       LIMIT 1`,
      [ano]
    );

    if (eventoPorAno.length > 0) {
      return eventoPorAno[0];
    }
  }

  const [eventoMaisRecente] = await db.query(
    `SELECT id, nome, data, cidade, sede
     FROM eventos
     WHERE teve_resultados = 1
     ORDER BY data DESC, id DESC
     LIMIT 1`
  );

  return eventoMaisRecente[0] || null;
}

async function buscarProvasEquipeNoEvento(eventoId, equipeId) {
  const [provas] = await db.query(
    `SELECT
       rc.prova_id,
       rc.nome_prova,
       rc.sexo_prova,
       rc.eh_revezamento,
       MIN(rc.ordem) AS ordem
     FROM resultadosCompletos rc
     WHERE rc.eventos_id = ?
       AND rc.equipes_id = ?
       AND rc.status = 'OK'
       AND (
         (rc.eh_revezamento = 0 AND rc.nadadores_id IS NOT NULL)
         OR rc.eh_revezamento = 1
       )
     GROUP BY rc.prova_id, rc.nome_prova, rc.sexo_prova, rc.eh_revezamento
     ORDER BY MIN(rc.ordem) ASC, rc.eh_revezamento ASC, rc.sexo_prova ASC`,
    [eventoId, equipeId]
  );

  return provas;
}

async function montarRelatorioPosProva({ eventoId, equipeId, provaId, sexoProva }) {
  const [equipeRows, eventoRows, provaRows] = await Promise.all([
    db.query('SELECT id, nome FROM equipes WHERE id = ? LIMIT 1', [equipeId]).then(result => result[0]),
    db.query('SELECT id, nome, data, cidade, sede FROM eventos WHERE id = ? LIMIT 1', [eventoId]).then(result => result[0]),
    db.query(
      `SELECT DISTINCT prova_id, nome_prova, sexo_prova, eh_revezamento
       FROM resultadosCompletos
       WHERE eventos_id = ? AND prova_id = ? AND sexo_prova = ?
       LIMIT 1`,
      [eventoId, provaId, sexoProva]
    ).then(result => result[0])
  ]);

  const equipe = equipeRows[0];
  const evento = eventoRows[0];
  const prova = provaRows[0];

  if (!equipe || !evento || !prova) {
    return null;
  }

  if (Number(prova.eh_revezamento) === 1) {
    const [linhasRevezamento] = await db.query(
      `SELECT
         rc.equipes_id,
         rc.nome_equipe,
         rc.tempo,
         rc.minutos,
         rc.segundos,
         rc.centesimos,
         (
           SELECT MIN(r2.minutos * 6000 + r2.segundos * 100 + r2.centesimos)
           FROM resultadosCompletos r2
           JOIN eventos e2 ON e2.id = r2.eventos_id
           JOIN eventos eAtual ON eAtual.id = rc.eventos_id
           WHERE r2.equipes_id = rc.equipes_id
             AND r2.prova_id = rc.prova_id
             AND r2.sexo_prova = rc.sexo_prova
             AND r2.eh_revezamento = 1
             AND r2.status = 'OK'
             AND COALESCE(r2.tempo, '') NOT IN ('DQL', 'NC')
             AND (r2.minutos * 6000 + r2.segundos * 100 + r2.centesimos) > 0
             AND r2.eventos_id <> rc.eventos_id
             AND e2.data < eAtual.data
         ) AS record_anterior_centesimos,
         (
           SELECT MIN(rg.minutos * 6000 + rg.segundos * 100 + rg.centesimos)
           FROM resultadosCompletos rg
           JOIN eventos eg ON eg.id = rg.eventos_id
           JOIN eventos eAtual2 ON eAtual2.id = rc.eventos_id
           WHERE rg.prova_id = rc.prova_id
             AND rg.sexo_prova = rc.sexo_prova
             AND rg.eh_revezamento = 1
             AND rg.status = 'OK'
             AND COALESCE(rg.tempo, '') NOT IN ('DQL', 'NC')
             AND (rg.minutos * 6000 + rg.segundos * 100 + rg.centesimos) > 0
             AND eg.data <= eAtual2.data
         ) AS record_geral_centesimos
       FROM resultadosCompletos rc
       WHERE rc.eventos_id = ?
         AND rc.equipes_id = ?
         AND rc.prova_id = ?
         AND rc.sexo_prova = ?
         AND rc.status = 'OK'
         AND COALESCE(rc.tempo, '') NOT IN ('DQL', 'NC')
         AND (rc.minutos * 6000 + rc.segundos * 100 + rc.centesimos) > 0
         AND rc.eh_revezamento = 1
       ORDER BY rc.minutos ASC, rc.segundos ASC, rc.centesimos ASC, rc.nome_equipe ASC`,
      [eventoId, equipeId, provaId, sexoProva]
    );

    let melhoraram = 0;
    let pioraram = 0;
    let primeiraVez = 0;
    let mantiveram = 0;

    const atletasRevezamento = linhasRevezamento.map((row) => {
      const tempoRealizadoCentesimos = tempoParaCentesimos(row.minutos, row.segundos, row.centesimos, row.tempo);
      const temRecordAnterior = row.record_anterior_centesimos !== null && row.record_anterior_centesimos !== undefined;
      const deltaRecordAnterior = temRecordAnterior && tempoRealizadoCentesimos !== null
        ? tempoRealizadoCentesimos - Number(row.record_anterior_centesimos)
        : null;
      const deltaRecordGeral = row.record_geral_centesimos !== null && row.record_geral_centesimos !== undefined && tempoRealizadoCentesimos !== null
        ? tempoRealizadoCentesimos - Number(row.record_geral_centesimos)
        : null;

      if (!temRecordAnterior) {
        primeiraVez += 1;
      } else if (deltaRecordAnterior < 0) {
        melhoraram += 1;
      } else if (deltaRecordAnterior > 0) {
        pioraram += 1;
      } else {
        mantiveram += 1;
      }

      return {
        nadador: row.nome_equipe || equipe.nome,
        categoria: 'Revezamento',
        tempo_realizado: row.tempo,
        diferenca_record_anterior: formatarTempo(deltaRecordAnterior),
        diferenca_record_geral: formatarTempo(deltaRecordGeral),
        diferenca_record_anterior_centesimos: deltaRecordAnterior,
        diferenca_record_geral_centesimos: deltaRecordGeral,
        primeira_vez: !temRecordAnterior
      };
    });

    return {
      evento,
      equipe,
      prova,
      atletas: atletasRevezamento,
      resumo: {
        total_nadadores: atletasRevezamento.length,
        melhoraram,
        pioraram,
        mantiveram,
        primeira_vez: primeiraVez
      },
      gerado_em: new Date().toISOString()
    };
  }

  const [linhas] = await db.query(
    `SELECT
       rc.nadadores_id,
       rc.nome_nadador,
       rc.categoria_nadador,
       rc.tempo,
       rc.minutos,
       rc.segundos,
       rc.centesimos,
       (
         SELECT MIN(r2.minutos * 6000 + r2.segundos * 100 + r2.centesimos)
         FROM resultadosCompletos r2
         JOIN eventos e2 ON e2.id = r2.eventos_id
         JOIN eventos eAtual ON eAtual.id = rc.eventos_id
         WHERE r2.nadadores_id = rc.nadadores_id
           AND r2.prova_id = rc.prova_id
           AND r2.sexo_prova = rc.sexo_prova
           AND r2.status = 'OK'
           AND COALESCE(r2.tempo, '') NOT IN ('DQL', 'NC')
           AND (r2.minutos * 6000 + r2.segundos * 100 + r2.centesimos) > 0
           AND r2.eventos_id <> rc.eventos_id
           AND e2.data < eAtual.data
       ) AS record_anterior_centesimos,
       (
         SELECT MIN(rg.minutos * 6000 + rg.segundos * 100 + rg.centesimos)
         FROM resultadosCompletos rg
         JOIN eventos eg ON eg.id = rg.eventos_id
         JOIN eventos eAtual2 ON eAtual2.id = rc.eventos_id
         WHERE rg.prova_id = rc.prova_id
           AND rg.sexo_prova = rc.sexo_prova
           AND rg.status = 'OK'
           AND COALESCE(rg.tempo, '') NOT IN ('DQL', 'NC')
           AND (rg.minutos * 6000 + rg.segundos * 100 + rg.centesimos) > 0
           AND eg.data <= eAtual2.data
       ) AS record_geral_centesimos
     FROM resultadosCompletos rc
     WHERE rc.eventos_id = ?
       AND rc.equipes_id = ?
       AND rc.prova_id = ?
       AND rc.sexo_prova = ?
       AND rc.status = 'OK'
       AND COALESCE(rc.tempo, '') NOT IN ('DQL', 'NC')
       AND (rc.minutos * 6000 + rc.segundos * 100 + rc.centesimos) > 0
       AND rc.eh_revezamento = 0
       AND rc.nadadores_id IS NOT NULL
     ORDER BY rc.minutos ASC, rc.segundos ASC, rc.centesimos ASC, rc.nome_nadador ASC`,
    [eventoId, equipeId, provaId, sexoProva]
  );

  let melhoraram = 0;
  let pioraram = 0;
  let primeiraVez = 0;
  let mantiveram = 0;

  const atletas = linhas.map((row) => {
    const tempoRealizadoCentesimos = tempoParaCentesimos(row.minutos, row.segundos, row.centesimos, row.tempo);
    const temRecordAnterior = row.record_anterior_centesimos !== null && row.record_anterior_centesimos !== undefined;
    const deltaRecordAnterior = temRecordAnterior && tempoRealizadoCentesimos !== null
      ? tempoRealizadoCentesimos - Number(row.record_anterior_centesimos)
      : null;
    const deltaRecordGeral = row.record_geral_centesimos !== null && row.record_geral_centesimos !== undefined && tempoRealizadoCentesimos !== null
      ? tempoRealizadoCentesimos - Number(row.record_geral_centesimos)
      : null;

    if (!temRecordAnterior) {
      primeiraVez += 1;
    } else if (deltaRecordAnterior < 0) {
      melhoraram += 1;
    } else if (deltaRecordAnterior > 0) {
      pioraram += 1;
    } else {
      mantiveram += 1;
    }

    return {
      nadador: row.nome_nadador,
      categoria: row.categoria_nadador,
      tempo_realizado: row.tempo,
      diferenca_record_anterior: formatarTempo(deltaRecordAnterior),
      diferenca_record_geral: formatarTempo(deltaRecordGeral),
      diferenca_record_anterior_centesimos: deltaRecordAnterior,
      diferenca_record_geral_centesimos: deltaRecordGeral,
      primeira_vez: !temRecordAnterior
    };
  });

  return {
    evento,
    equipe,
    prova,
    atletas,
    resumo: {
      total_nadadores: atletas.length,
      melhoraram,
      pioraram,
      mantiveram,
      primeira_vez: primeiraVez
    },
    gerado_em: new Date().toISOString()
  };
}

function caminhoCachePosProva(eventoId, equipeId, provaId, sexoProva) {
  const nome = `${eventoId}_${equipeId}_${normalizarNomeArquivo(provaId)}_${normalizarNomeArquivo(sexoProva)}.json`;
  return path.join(RELATORIOS_POS_PROVA_DIR, nome);
}

function caminhoCachePosProvaEvento(eventoId, equipeId) {
  const nome = `${eventoId}_${equipeId}_completo_v5.json`;
  return path.join(RELATORIOS_POS_PROVA_DIR, nome);
}

async function montarRelatorioPosProvaCompleto({ eventoId, equipeId }) {
  const [equipeRows, eventoRows] = await Promise.all([
    db.query('SELECT id, nome FROM equipes WHERE id = ? LIMIT 1', [equipeId]).then(result => result[0]),
    db.query('SELECT id, nome, data, cidade, sede FROM eventos WHERE id = ? LIMIT 1', [eventoId]).then(result => result[0])
  ]);

  const equipe = equipeRows[0];
  const evento = eventoRows[0];

  if (!equipe || !evento) {
    return null;
  }

  // Buscar todas as provas da equipe no evento
  const provas = await buscarProvasEquipeNoEvento(eventoId, equipeId);
  const provasOrdenadas = [...provas].sort((a, b) => {
    const ordemA = Number(a.ordem ?? 9999);
    const ordemB = Number(b.ordem ?? 9999);
    if (ordemA !== ordemB) return ordemA - ordemB;
    if (Number(a.eh_revezamento) !== Number(b.eh_revezamento)) {
      return Number(a.eh_revezamento) - Number(b.eh_revezamento);
    }
    return String(a.nome_prova || '').localeCompare(String(b.nome_prova || ''));
  });

  // Para cada prova, montar os dados
  const provasComDados = await Promise.all(
    provasOrdenadas.map(async (prova) => {
      const relatorioProva = await montarRelatorioPosProva({
        eventoId,
        equipeId,
        provaId: prova.prova_id,
        sexoProva: prova.sexo_prova
      });

      return {
        prova_id: prova.prova_id,
        nome_prova: prova.nome_prova,
        sexo_prova: prova.sexo_prova,
        ordem: prova.ordem,
        eh_revezamento: prova.eh_revezamento,
        ...relatorioProva
      };
    })
  );

  // Calcular resumo geral
  const resumoGeral = {
    total_nadadores: 0,
    melhoraram: 0,
    pioraram: 0,
    mantiveram: 0,
    primeira_vez: 0
  };

  provasComDados.forEach((provaData) => {
    if (provaData.resumo) {
      resumoGeral.total_nadadores += provaData.resumo.total_nadadores || 0;
      resumoGeral.melhoraram += provaData.resumo.melhoraram || 0;
      resumoGeral.pioraram += provaData.resumo.pioraram || 0;
      resumoGeral.mantiveram += provaData.resumo.mantiveram || 0;
      resumoGeral.primeira_vez += provaData.resumo.primeira_vez || 0;
    }
  });

  return {
    evento,
    equipe,
    provas: provasComDados,
    resumo_geral: resumoGeral,
    gerado_em: new Date().toISOString()
  };
}

// Rota para buscar todos os resultados dos nadadores da equipe logada
router.get('/resultados-equipe/:equipeId', async (req, res) => {
  const { equipeId } = req.params;

  try {
    // Busca DIRETO da tabela resultadosCompletos que já tem tudo!
    const [resultados] = await db.query(`
      SELECT 
        rc.id,
        e.nome AS evento_nome,
        e.data AS evento_data,
        e.cidade AS evento_cidade,
        e.sede AS evento_sede,
        rc.nome_prova AS prova_nome,
        rc.sexo_prova,
        rc.nome_nadador AS nadador_nome,
        rc.sexo_nadador,
        rc.categoria_nadador AS categoria_nome,
        rc.tempo,
        rc.classificacao,
        rc.status,
        rc.tipo,
        rc.pontuacao_individual,
        rc.pontuacao_equipe,
        rc.eh_revezamento,
        COALESCE(
          rc.diferenca_centesimos,
          CASE
            WHEN rc.minutos IS NULL OR rc.segundos IS NULL OR rc.centesimos IS NULL THEN NULL
            WHEN rc.nadadores_id IS NOT NULL
                 AND i.minutos IS NOT NULL
                 AND i.segundos IS NOT NULL
                 AND i.centesimos IS NOT NULL
                 AND (i.minutos * 6000 + i.segundos * 100 + i.centesimos) > 0
              THEN (rc.minutos * 6000 + rc.segundos * 100 + rc.centesimos) - (i.minutos * 6000 + i.segundos * 100 + i.centesimos)
            WHEN rc.eh_revezamento = 1
                 AND ri.minutos IS NOT NULL
                 AND ri.segundos IS NOT NULL
                 AND ri.centesimos IS NOT NULL
                 AND (ri.minutos * 6000 + ri.segundos * 100 + ri.centesimos) > 0
              THEN (rc.minutos * 6000 + rc.segundos * 100 + rc.centesimos) - (ri.minutos * 6000 + ri.segundos * 100 + ri.centesimos)
            ELSE NULL
          END
        ) AS diferenca_centesimos,
        rc.ordem
      FROM resultadosCompletos rc
      JOIN eventos e ON rc.eventos_id = e.id
      LEFT JOIN inscricoes i
        ON i.nadadores_id = rc.nadadores_id
       AND i.eventos_provas_id = rc.eventos_provas_id
      LEFT JOIN revezamentos_inscricoes ri
        ON ri.equipes_id = rc.equipes_id
       AND ri.eventos_provas_id = rc.eventos_provas_id
      WHERE rc.equipes_id = ? 
      AND rc.status = 'OK'
      ORDER BY e.data DESC, rc.ordem ASC, rc.classificacao ASC
    `, [equipeId]);

    console.log(`Total de resultados encontrados para equipe ${equipeId}: ${resultados.length}`);

    // Agrupar por evento
    const relatorio = {};
    resultados.forEach(row => {
      const eventoKey = `${row.evento_nome} - ${row.evento_data}`;
      
      if (!relatorio[eventoKey]) {
        relatorio[eventoKey] = {
          evento: row.evento_nome,
          data: row.evento_data,
          cidade: row.evento_cidade,
          sede: row.evento_sede,
          provas: []
        };
      }

      relatorio[eventoKey].provas.push({
        prova: row.prova_nome,
        sexo_prova: row.sexo_prova,
        nadador: row.nadador_nome || 'Revezamento',
        sexo_nadador: row.sexo_nadador,
        categoria: row.categoria_nome,
        tempo: row.tempo,
        diferenca_centesimos: row.diferenca_centesimos,
        classificacao: row.classificacao,
        status: row.status,
        pontuacao_individual: row.pontuacao_individual,
        pontuacao_equipe: row.pontuacao_equipe,
        eh_revezamento: row.eh_revezamento
      });
    });

    res.json(Object.values(relatorio));
  } catch (error) {
    console.error('Erro ao buscar resultados da equipe:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar resultados da equipe',
      message: error.message 
    });
  }
});

// Rota para buscar estatísticas resumidas da equipe
router.get('/estatisticas-equipe/:equipeId', async (req, res) => {
  const { equipeId } = req.params;
  const { ano } = req.query;

  try {
    const anoNumero = Number(ano);
    const possuiAnoValido = Number.isInteger(anoNumero) && anoNumero > 1900;

    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT rc.nadadores_id) AS total_nadadores,
        COUNT(*) AS total_provas,
        SUM(CASE WHEN rc.classificacao = 1 THEN 1 ELSE 0 END) AS total_ouro,
        SUM(CASE WHEN rc.classificacao = 2 THEN 1 ELSE 0 END) AS total_prata,
        SUM(CASE WHEN rc.classificacao = 3 THEN 1 ELSE 0 END) AS total_bronze,
        COALESCE(SUM(rc.pontuacao_individual), 0) AS total_pontos_individuais,
        COALESCE(SUM(rc.pontuacao_equipe), 0) AS total_pontos_equipe
      FROM resultadosCompletos rc
      JOIN eventos e ON rc.eventos_id = e.id
      WHERE rc.equipes_id = ? 
      AND rc.status = 'OK'
      AND (? = 0 OR YEAR(e.data) = ?)
    `, [equipeId, possuiAnoValido ? 1 : 0, possuiAnoValido ? anoNumero : 0]);

    res.json({
      ...(stats[0] || {}),
      ano_referencia: possuiAnoValido ? anoNumero : null
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas da equipe:', error.message);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Rota para buscar melhores tempos por nadador e prova
router.get('/melhores-tempos/:equipeId', async (req, res) => {
  const { equipeId } = req.params;

  try {
    // subquery para pegar o evento do melhor tempo + melhor tempo absoluto de cada prova
    const [melhoresTempos] = await db.query(`
      SELECT 
        rc1.prova_id,
        rc1.nome_nadador AS nadador_nome,
        rc1.sexo_nadador AS nadador_sexo,
        rc1.categoria_nadador AS categoria_nome,
        rc1.nome_prova AS prova_nome,
        rc1.tempo AS tempo_original,
        rc1.minutos,
        rc1.segundos,
        rc1.centesimos,
        e.nome AS evento_nome,
        e.data AS evento_data,
        recordGlobal.melhor_tempo_global
      FROM resultadosCompletos rc1
      JOIN eventos e ON rc1.eventos_id = e.id
      JOIN nadadores n ON rc1.nadadores_id = n.id
      JOIN (
        SELECT 
          nadadores_id,
          prova_id,
          MIN(minutos * 6000 + segundos * 100 + centesimos) AS melhor_tempo_centesimos
        FROM resultadosCompletos
        WHERE equipes_id = ?
          AND status = 'OK'
          AND eh_revezamento = 0
          AND nadadores_id IS NOT NULL
          AND COALESCE(tempo, '') NOT IN ('DQL', 'NC')
          AND (COALESCE(minutos, 0) * 6000 + COALESCE(segundos, 0) * 100 + COALESCE(centesimos, 0)) > 0
        GROUP BY nadadores_id, prova_id
      ) rc2 ON rc1.nadadores_id = rc2.nadadores_id 
            AND rc1.prova_id = rc2.prova_id
            AND (rc1.minutos * 6000 + rc1.segundos * 100 + rc1.centesimos) = rc2.melhor_tempo_centesimos
      LEFT JOIN (
        SELECT 
          prova_id,
          MIN(minutos * 6000 + segundos * 100 + centesimos) AS melhor_tempo_global
        FROM resultadosCompletos
        WHERE status = 'OK'
          AND eh_revezamento = 0
          AND nadadores_id IS NOT NULL
          AND COALESCE(tempo, '') NOT IN ('DQL', 'NC')
          AND (COALESCE(minutos, 0) * 6000 + COALESCE(segundos, 0) * 100 + COALESCE(centesimos, 0)) > 0
        GROUP BY prova_id
      ) recordGlobal ON rc1.prova_id = recordGlobal.prova_id
      WHERE rc1.equipes_id = ?
        AND rc1.status = 'OK'
        AND rc1.eh_revezamento = 0
        AND rc1.nadadores_id IS NOT NULL
        AND n.equipes_id = ?
        AND n.ativo = 1
      GROUP BY rc1.nadadores_id, rc1.prova_id, rc1.nome_nadador, rc1.sexo_nadador, rc1.categoria_nadador, rc1.nome_prova, rc1.tempo, rc1.minutos, rc1.segundos, rc1.centesimos, e.nome, e.data, recordGlobal.melhor_tempo_global
      ORDER BY rc1.nome_nadador ASC, rc1.nome_prova ASC
    `, [equipeId, equipeId, equipeId]);

    // 🔹 Converte tempo para formato mm:ss:cc
    const resultado = melhoresTempos.map(row => {
      const minutos = row.minutos || 0;
      const segundos = row.segundos || 0;
      const centesimos = row.centesimos || 0;
      const tempoOriginal = String(row.tempo_original || '').toUpperCase();
      const tempoCentesimos = (minutos * 6000) + (segundos * 100) + centesimos;
      const melhorTempoFormatado = (tempoOriginal === 'DQL' || tempoOriginal === 'NC')
        ? tempoOriginal
        : `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
      
      return {
        prova_id: row.prova_id,
        nadador_nome: row.nadador_nome,
        nadador_sexo: row.nadador_sexo,
        categoria_nome: row.categoria_nome,
        prova_nome: row.prova_nome,
        melhor_tempo_centesimos: tempoCentesimos,
        melhor_tempo_global_centesimos: row.melhor_tempo_global || null,
        melhor_tempo: melhorTempoFormatado,
        evento_nome: row.evento_nome,
        evento_data: row.evento_data
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar melhores tempos:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar melhores tempos',
      message: error.message 
    });
  }
});

// Rota para buscar records por prova (agrupado por prova)
router.get('/records-por-prova/:equipeId', async (req, res) => {
  const { equipeId } = req.params;

  try {
    // Agrupa por prova_id + nadadores_id para pegar o melhor tempo de cada nadador em cada prova
    const [recordsPorProva] = await db.query(`
      SELECT 
        rc1.nome_prova AS prova_nome,
        rc1.sexo_prova,
        rc1.nome_nadador AS nadador_nome,
        rc1.categoria_nadador AS categoria_nome,
        rc1.minutos,
        rc1.segundos,
        rc1.centesimos,
        e.nome AS evento_nome,
        e.data AS evento_data
      FROM resultadosCompletos rc1
      JOIN eventos e ON rc1.eventos_id = e.id
      JOIN nadadores n ON rc1.nadadores_id = n.id
      JOIN (
        SELECT 
          nadadores_id,
          prova_id,
          sexo_prova,
          MIN(minutos * 6000 + segundos * 100 + centesimos) AS melhor_tempo_centesimos
        FROM resultadosCompletos
        WHERE equipes_id = ?
          AND status = 'OK'
          AND eh_revezamento = 0
          AND nadadores_id IS NOT NULL
        GROUP BY nadadores_id, prova_id, sexo_prova
      ) rc2 ON rc1.nadadores_id = rc2.nadadores_id
            AND rc1.prova_id = rc2.prova_id
            AND rc1.sexo_prova = rc2.sexo_prova
            AND (rc1.minutos * 6000 + rc1.segundos * 100 + rc1.centesimos) = rc2.melhor_tempo_centesimos
      WHERE rc1.equipes_id = ?
        AND rc1.status = 'OK'
        AND rc1.eh_revezamento = 0
        AND rc1.nadadores_id IS NOT NULL
        AND n.equipes_id = ?
        AND n.ativo = 1
      ORDER BY rc1.nome_prova ASC, rc1.sexo_prova ASC, (rc1.minutos * 6000 + rc1.segundos * 100 + rc1.centesimos) ASC
    `, [equipeId, equipeId, equipeId]);

    // Converte tempo para formato mm:ss:cc
    const resultado = recordsPorProva.map(row => {
      const minutos = row.minutos || 0;
      const segundos = row.segundos || 0;
      const centesimos = row.centesimos || 0;
      
      return {
        prova_nome: row.prova_nome,
        sexo_prova: row.sexo_prova,
        nadador_nome: row.nadador_nome,
        categoria_nome: row.categoria_nome,
        tempo_record: `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`,
        evento_nome: row.evento_nome,
        evento_data: row.evento_data
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar records por prova:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar records por prova',
      message: error.message 
    });
  }
});

// Rota para buscar nadadores da equipe por nome (autocomplete)
router.get('/buscar-nadadores/:equipeId', async (req, res) => {
  const { equipeId } = req.params;
  const { termo } = req.query;

  try {
    let query = `
      SELECT DISTINCT
        n.id,
        n.nome
      FROM nadadores n
      WHERE n.equipes_id = ?
      AND n.ativo = 1
    `;
    const params = [equipeId];

    if (termo && termo.trim() !== '') {
      query += ` AND n.nome LIKE ?`;
      params.push(`%${termo}%`);
    }

    query += ` ORDER BY n.nome ASC LIMIT 10`;

    const [nadadores] = await db.query(query, params);
    res.json(nadadores);
  } catch (error) {
    console.error('Erro ao buscar nadadores:', error.message);
    res.status(500).json({ error: 'Erro ao buscar nadadores' });
  }
});

router.get('/pos-prova/eventos/:equipeId', async (req, res) => {
  const { equipeId } = req.params;
  const { ano } = req.query;

  try {
    // Busca eventos onde a equipe tem resultados
    const queryAno = ano ? 'AND YEAR(e.data) = ?' : '';
    const params = ano ? [equipeId, ano] : [equipeId];

    const [eventos] = await db.query(
      `SELECT DISTINCT
         e.id,
         e.nome,
         e.data,
         e.cidade,
         e.sede
       FROM eventos e
       JOIN resultadosCompletos rc ON rc.eventos_id = e.id
       WHERE rc.equipes_id = ?
         AND rc.status = 'OK'
         AND e.teve_resultados = 1
         ${queryAno}
       ORDER BY e.data DESC`,
      params
    );

    const opcoes = eventos.map((evento) => ({
      id: evento.id,
      nome: `${evento.nome} - ${new Date(evento.data).toLocaleDateString('pt-BR')}`
    }));

    res.json({ eventos: opcoes });
  } catch (error) {
    console.error('Erro ao listar eventos do relatório pós-prova:', error.message);
    res.status(500).json({ error: 'Erro ao listar eventos para o relatório pós-prova.' });
  }
});

router.get('/pos-prova/arquivo/:equipeId', async (req, res) => {
  const { equipeId } = req.params;
  const { eventoId } = req.query;

  if (!eventoId) {
    return res.status(400).json({ error: 'Parâmetro eventoId é obrigatório.' });
  }

  try {
    const [eventoRows] = await db.query(
      'SELECT id, nome, data, cidade, sede FROM eventos WHERE id = ? LIMIT 1',
      [eventoId]
    );

    const evento = eventoRows[0];
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    garantirDiretorioRelatorios();
    const arquivoCache = caminhoCachePosProvaEvento(evento.id, equipeId);

    if (fs.existsSync(arquivoCache)) {
      const conteudo = fs.readFileSync(arquivoCache, 'utf8');
      return res.json(JSON.parse(conteudo));
    }

    const relatorio = await montarRelatorioPosProvaCompleto({
      eventoId: evento.id,
      equipeId
    });

    if (!relatorio) {
      return res.status(404).json({ error: 'Não foi possível montar o relatório para os parâmetros informados.' });
    }

    fs.writeFileSync(arquivoCache, JSON.stringify(relatorio), 'utf8');
    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar/obter relatório pós-prova:', error.message);
    res.status(500).json({ error: 'Erro ao gerar relatório pós-prova.' });
  }
});

router.post('/pos-prova/pregerar', async (req, res) => {
  const { eventoId, ano } = req.body || {};

  try {
    const evento = await buscarEventoBase(eventoId, ano);
    if (!evento) {
      return res.status(404).json({ error: 'Nenhum evento com resultados encontrado para pré-geração.' });
    }

    const [equipes] = await db.query(
      `SELECT DISTINCT equipes_id
       FROM resultadosCompletos
       WHERE eventos_id = ?
         AND equipes_id IS NOT NULL`,
      [evento.id]
    );

    garantirDiretorioRelatorios();

    let totalRelatorios = 0;
    for (const equipe of equipes) {
      const relatorio = await montarRelatorioPosProvaCompleto({
        eventoId: evento.id,
        equipeId: equipe.equipes_id
      });

      if (!relatorio) continue;

      const arquivoCache = caminhoCachePosProvaEvento(evento.id, equipe.equipes_id);
      fs.writeFileSync(arquivoCache, JSON.stringify(relatorio), 'utf8');
      totalRelatorios += 1;
    }

    res.json({
      success: true,
      evento_id: evento.id,
      evento_nome: evento.nome,
      total_equipes: equipes.length,
      total_relatorios: totalRelatorios
    });
  } catch (error) {
    console.error('Erro na pré-geração de relatórios pós-prova:', error.message);
    res.status(500).json({ error: 'Erro ao pré-gerar relatórios pós-prova.' });
  }
});

module.exports = router;
