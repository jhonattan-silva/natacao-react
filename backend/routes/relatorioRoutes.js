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
    const [melhoresTempos] = await db.query(`
      SELECT 
        n.nome AS nadador_nome,
        n.sexo AS nadador_sexo,
        cat.nome AS categoria_nome,
        CONCAT(p.distancia, ' METROS ', p.estilo) AS prova_nome,
        CONCAT(
          LPAD(r.minutos, 2, '0'), ':', 
          LPAD(r.segundos, 2, '0'), ':', 
          LPAD(r.centesimos, 2, '0')
        ) AS melhor_tempo,
        e.nome AS evento_nome,
        e.data AS evento_data
      FROM records r
      JOIN nadadores n ON r.Nadadores_id = n.id
      JOIN provas p ON r.provas_id = p.id
      JOIN categorias cat ON n.categorias_id = cat.id
      JOIN eventos e ON r.eventos_id = e.id
      WHERE n.equipes_id = ?
      ORDER BY n.nome ASC, p.distancia ASC, p.estilo ASC
    `, [equipeId]);

    res.json(melhoresTempos);
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
    const [recordsPorProva] = await db.query(`
      SELECT 
        CONCAT(p.distancia, ' METROS ', p.estilo) AS prova_nome,
        p.sexo AS sexo_prova,
        n.nome AS nadador_nome,
        cat.nome AS categoria_nome,
        CONCAT(
          LPAD(r.minutos, 2, '0'), ':', 
          LPAD(r.segundos, 2, '0'), ':', 
          LPAD(r.centesimos, 2, '0')
        ) AS tempo_record,
        e.nome AS evento_nome,
        e.data AS evento_data
      FROM records r
      JOIN nadadores n ON r.Nadadores_id = n.id
      JOIN provas p ON r.provas_id = p.id
      JOIN categorias cat ON n.categorias_id = cat.id
      JOIN eventos e ON r.eventos_id = e.id
      WHERE n.equipes_id = ?
      ORDER BY p.distancia ASC, p.estilo ASC, p.sexo ASC, r.minutos ASC, r.segundos ASC, r.centesimos ASC
    `, [equipeId]);

    res.json(recordsPorProva);
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
