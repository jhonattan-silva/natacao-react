const express = require('express');
const router = express.Router();
const db = require('../config/db');

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
        rc.diferenca_centesimos,
        rc.ordem
      FROM resultadosCompletos rc
      JOIN eventos e ON rc.eventos_id = e.id
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

  try {
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
      WHERE rc.equipes_id = ? 
      AND rc.status = 'OK'
    `, [equipeId]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas da equipe:', error.message);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Rota para buscar melhores tempos por nadador e prova
router.get('/melhores-tempos/:equipeId', async (req, res) => {
  const { equipeId } = req.params;

  try {
    // subquery para pegar o evento do melhor tempo
    const [melhoresTempos] = await db.query(`
      SELECT 
        rc1.nome_nadador AS nadador_nome,
        rc1.sexo_nadador AS nadador_sexo,
        rc1.categoria_nadador AS categoria_nome,
        rc1.nome_prova AS prova_nome,
        rc1.minutos,
        rc1.segundos,
        rc1.centesimos,
        e.nome AS evento_nome,
        e.data AS evento_data
      FROM resultadosCompletos rc1
      JOIN eventos e ON rc1.eventos_id = e.id
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
        GROUP BY nadadores_id, prova_id
      ) rc2 ON rc1.nadadores_id = rc2.nadadores_id 
            AND rc1.prova_id = rc2.prova_id
            AND (rc1.minutos * 6000 + rc1.segundos * 100 + rc1.centesimos) = rc2.melhor_tempo_centesimos
      WHERE rc1.equipes_id = ?
        AND rc1.status = 'OK'
        AND rc1.eh_revezamento = 0
        AND rc1.nadadores_id IS NOT NULL
      GROUP BY rc1.nadadores_id, rc1.prova_id, rc1.nome_nadador, rc1.sexo_nadador, rc1.categoria_nadador, rc1.nome_prova, rc1.minutos, rc1.segundos, rc1.centesimos, e.nome, e.data
      ORDER BY rc1.nome_nadador ASC, rc1.nome_prova ASC
    `, [equipeId, equipeId]);

    // 🔹 Converte tempo para formato mm:ss:cc
    const resultado = melhoresTempos.map(row => {
      const minutos = row.minutos || 0;
      const segundos = row.segundos || 0;
      const centesimos = row.centesimos || 0;
      
      return {
        nadador_nome: row.nadador_nome,
        nadador_sexo: row.nadador_sexo,
        categoria_nome: row.categoria_nome,
        prova_nome: row.prova_nome,
        melhor_tempo: `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`,
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
      ORDER BY rc1.nome_prova ASC, rc1.sexo_prova ASC, (rc1.minutos * 6000 + rc1.segundos * 100 + rc1.centesimos) ASC
    `, [equipeId, equipeId]);

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

module.exports = router;
