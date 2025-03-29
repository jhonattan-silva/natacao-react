const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Retorna os balizamentos do evento
router.get('/balizamentosEvento/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const queryProvas = `
      SELECT DISTINCT
        ep.id AS eventos_provas_id,
        p.id AS prova_id,
        CONCAT(p.estilo, ' ', p.distancia, 'm ', IF(p.eh_revezamento, 'Revezamento', 'Individual'), ' (', p.sexo, ')') AS nome,
        p.estilo AS prova_estilo,
        p.distancia,
        p.sexo,
        p.eh_revezamento,
        ep.ordem
      FROM 
        eventos_provas ep
      JOIN 
        provas p ON ep.provas_id = p.id
      WHERE 
        ep.eventos_id = ?
      ORDER BY ep.ordem ASC;
    `;
    const [provas] = await db.query(queryProvas, [eventoId]);
    if (provas.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const balizamentosEvento = [];
    for (const prova of provas) {
      const queryBaterias = `
        SELECT
          b.id AS bateriaId,
          b.descricao AS numeroBateria,
          bi.raia,
          n.id AS nadadorId,
          n.nome AS nomeNadador,
          COALESCE(e.id, eq.id) AS equipeId,  
          COALESCE(e.nome, eq.nome) AS nomeEquipe,  
          c.nome AS categoriaNadador
        FROM baterias b
        INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
        LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
        LEFT JOIN nadadores n ON i.nadadores_id = n.id
        LEFT JOIN categorias c ON n.categorias_id = c.id
        LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
        LEFT JOIN equipes e ON ri.equipes_id = e.id
        LEFT JOIN equipes eq ON n.equipes_id = eq.id
        WHERE b.eventos_provas_id = ?
        ORDER BY b.id, bi.raia;
      `;
      const [baterias] = await db.query(queryBaterias, [prova.eventos_provas_id]);

      const bateriasOrganizadas = baterias.reduce((acc, row) => {
        let bateria = acc.find(b => b.bateriaId === row.bateriaId);
        if (!bateria) {
          bateria = {
            bateriaId: row.bateriaId,
            numeroBateria: row.numeroBateria,
            nadadores: [],
          };
          acc.push(bateria);
        }
        const nadadorData = {
          id: row.nadadorId,
          raia: row.raia,
          equipe: row.nomeEquipe
        };
        if (!prova.eh_revezamento) {
          nadadorData.nome = row.nomeNadador;
          nadadorData.categoria = row.categoriaNadador;
        }
        bateria.nadadores.push(nadadorData);
        return acc;
      }, []);

      balizamentosEvento.push({
        prova: {
          eventos_provas_id: prova.eventos_provas_id,
          prova_id: prova.prova_id,
          nome: prova.nome,
          ordem: prova.ordem,
          revezamento: prova.eh_revezamento === 1
        },
        baterias: bateriasOrganizadas,
      });
    }

    res.json(balizamentosEvento);
  } catch (error) {
    console.error('Erro ao buscar balizamentos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar balizamentos' });
  }
});

// Retorna os balizamentos armazenados no banco para o evento
router.get('/listarDoBanco/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const [resultados] = await db.query(`
      SELECT 
        c.id, 
        c.eventos_provas_id, 
        p.id AS prova_id, 
        CONCAT(p.distancia, 'm', ' ', p.estilo) AS prova_nome, 
        c.nadadores_id, 
        n.nome AS nome_nadador, 
        c.equipes_id, 
        e.nome AS nome_equipe, 
        c.tempo, 
        c.classificacao, 
        c.status, 
        c.tipo,
        p.eh_revezamento,
        p.sexo AS sexo_prova,
        n.sexo AS sexo_nadador,
        cat.nome AS categoria_nadador,
        ep.ordem
      FROM classificacoes c
      JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
      JOIN provas p ON ep.provas_id = p.id
      LEFT JOIN nadadores n ON c.nadadores_id = n.id
      LEFT JOIN equipes e ON c.equipes_id = e.id
      LEFT JOIN categorias cat ON n.categorias_id = cat.id
      WHERE ep.eventos_id = ?
      ORDER BY ep.ordem ASC, c.tipo ASC, c.eventos_provas_id ASC, c.classificacao ASC;
    `, [eventoId]);

    const classificacao = {};
    resultados.forEach(row => {
      const provaKey = row.eh_revezamento
        ? `Revezamento - ${row.prova_nome} (${row.sexo_prova})`
        : `${row.prova_nome} (${row.sexo_nadador})`;

      if (!classificacao[provaKey]) {
        classificacao[provaKey] = [];
      }

      classificacao[provaKey].push({
        id: row.id,
        eventos_provas_id: row.eventos_provas_id,
        prova_id: row.prova_id,
        prova_nome: row.prova_nome,
        nadadores_id: row.nadadores_id,
        nome_nadador: row.nome_nadador,
        equipes_id: row.equipes_id,
        nome_equipe: row.nome_equipe,
        tempo: row.tempo,
        classificacao: row.classificacao,
        status: row.status,
        tipo: row.tipo,
        eh_revezamento: row.eh_revezamento,
        sexo_prova: row.sexo_prova,
        sexo_nadador: row.sexo_nadador,
        categoria_nadador: row.categoria_nadador
      });
    });

    for (const prova in classificacao) {
      classificacao[prova].sort((a, b) => {
        if (a.status === 'DQL' || a.status === 'NC') return 1;
        if (b.status === 'DQL' || b.status === 'NC') return -1;
        return a.classificacao - b.classificacao;
      });
    }

    res.json(classificacao);
  } catch (error) {
    console.error('Erro ao buscar balizamentos do banco:', error.message);
    res.status(500).json({ error: 'Erro ao buscar balizamentos do banco' });
  }
});

// Lista os eventos que possuem balizamentos
router.get('/listarEventosComBalizamentos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM eventos WHERE teve_resultados = true');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar eventos com balizamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar eventos com balizamentos',
      details: error.message,
    });
  }
});

module.exports = router;
