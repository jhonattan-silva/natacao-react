const express = require('express');
const router = express.Router();
const db = require('../config/db');

//Listar todos EVENTOS
router.get('/listarEventos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM eventos WHERE torneios_id = 3');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ message: 'Erro ao buscar eventos.' });
  }
});

router.get('/listarInscritos/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  if (!eventoId) {
    return res.status(400).send('Evento ID é necessário');
  }
  try {
    const [rows] = await db.query(`
      SELECT 
          p.id AS prova_id, 
          CONCAT(p.estilo, ' ', p.distancia, 'm ', ' ', p.sexo) AS nome_prova,
          ep.ordem,
          n.nome AS nome,
          n.data_nasc,
          n.id AS nadador_id,
          COALESCE(
            CONCAT(
              LPAD(r.minutos, 2, '0'), ':',
              LPAD(r.segundos, 2, '0'), ':',
              LPAD(r.centesimos, 2, '0')
            ), '00:00:00'
          ) AS melhor_tempo, 
          i.id AS inscricao_id,
          i.eventos_provas_id AS eventos_provas_id,
          e.nome AS equipe,
          c.nome AS categoria
      FROM inscricoes i
      INNER JOIN nadadores n ON i.nadadores_id = n.id
      INNER JOIN eventos_provas ep ON i.eventos_provas_id = ep.id
      INNER JOIN provas p ON ep.provas_id = p.id
      LEFT JOIN records r ON n.id = r.Nadadores_id AND ep.provas_id = r.provas_id
      LEFT JOIN equipes e ON n.equipes_id = e.id
      LEFT JOIN categorias c ON n.categorias_id = c.id
      WHERE i.eventos_id = ?
      ORDER BY ep.ordem ASC;
    `, [eventoId]);
    res.json(rows); // Retorna as inscrições com o ID da prova
  } catch (error) {
    console.error('Erro ao buscar inscritos:', error);
    res.status(500).send('Erro ao buscar inscrições');
  }
});

// Nova rota para listar inscritos por equipe
router.get('/listarInscritosEquipe', async (req, res) => {
  const { eventoId } = req.query; // opcional: filtro por evento
  try {
    let sql = `
      SELECT 
        COALESCE(e.nome, 'N/D') AS equipe,
        COUNT(*) AS total_inscritos
      FROM inscricoes i
      INNER JOIN nadadores n ON i.nadadores_id = n.id
      LEFT JOIN equipes e ON n.equipes_id = e.id
    `;
    const params = [];
    if (eventoId) {
      sql += ' WHERE i.eventos_id = ? ';
      params.push(eventoId);
    }
    sql += ' GROUP BY equipe ';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar inscritos por equipe:', error);
    res.status(500).json({ message: 'Erro ao buscar inscritos por equipe.' });
  }
});

// Nova rota para listar inscritos únicos por equipe
router.get('/listarInscritosUnicosEquipe', async (req, res) => {
  const { eventoId } = req.query; // opcional: filtro por evento
  try {
    let sql = `
      SELECT 
        COALESCE(e.nome, 'N/D') AS equipe,
        COUNT(DISTINCT i.nadadores_id) AS total_inscritos
      FROM inscricoes i
      INNER JOIN nadadores n ON i.nadadores_id = n.id
      LEFT JOIN equipes e ON n.equipes_id = e.id
    `;
    const params = [];
    if (eventoId) {
      sql += ' WHERE i.eventos_id = ? ';
      params.push(eventoId);
    }
    sql += ' GROUP BY equipe ';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar inscritos únicos por equipe:', error);
    res.status(500).json({ message: 'Erro ao buscar inscritos únicos por equipe.' });
  }
});

// Nova rota para listar inscritos por equipe com detalhamento de sexo e revezamentos
router.get('/listarInscritosEquipeSexo', async (req, res) => {
  const { eventoId } = req.query; // opcional: filtro por evento
  try {
    let sql = `
      SELECT 
        COALESCE(e.nome, 'N/D') AS equipe,
        COUNT(DISTINCT CASE WHEN n.sexo IN ('M','m') THEN i.nadadores_id END) AS atletas_masculinos,
        COUNT(DISTINCT CASE WHEN n.sexo IN ('F','f') THEN i.nadadores_id END) AS atletas_femininas,
        COUNT(DISTINCT i.nadadores_id) AS total_atletas,
        (
          COUNT(DISTINCT CASE 
            WHEN LOWER(CONCAT(p.estilo, ' ', p.distancia, 'm ', ' ', p.sexo)) LIKE '%revezamento%' 
            THEN i.nadadores_id 
          END)
          + IFNULL((
              SELECT COUNT(*) 
              FROM revezamentos_inscricoes ri 
              WHERE ri.eventos_id = i.eventos_id AND ri.equipes_id = e.id
            ), 0)
        ) AS revezamentos
      FROM inscricoes i
      INNER JOIN nadadores n ON i.nadadores_id = n.id
      LEFT JOIN equipes e ON n.equipes_id = e.id
      INNER JOIN eventos_provas ep ON i.eventos_provas_id = ep.id
      INNER JOIN provas p ON ep.provas_id = p.id
    `;
    const params = [];
    if (eventoId) {
      sql += ' WHERE i.eventos_id = ? ';
      params.push(eventoId);
    }
    // Modificado: incluir e.id no GROUP BY para atender only_full_group_by
    sql += ' GROUP BY e.id, equipe ';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar inscritos por equipe (sexo):', error);
    res.status(500).json({ message: 'Erro ao buscar inscritos por equipe (sexo).' });
  }
});

router.post('/salvarBalizamento', async (req, res) => {
  const { eventoId, balizamento } = req.body;

  if (!eventoId || !balizamento) {
    return res.status(400).json({ success: false, message: 'Evento ID e balizamento são obrigatórios.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const [checkEvent] = await connection.query(
      "SELECT inscricao_aberta FROM eventos WHERE id = ?",
      [eventoId]
    );
    if (!checkEvent[0] || checkEvent[0].inscricao_aberta !== 0) {
      return res.status(400).json({
        success: false,
        message: 'As inscrições deste evento ainda estão abertas.'
      });
    }

    // Array para armazenar mensagens de provas ignoradas
    const ignoredProvas = [];

    for (const [prova, baterias] of Object.entries(balizamento)) {
      // Verifica se a prova possui pelo menos 3 inscritos
      const totalInscritos = baterias.reduce((acc, bateria) => acc + bateria.length, 0);
      if (totalInscritos < 3) {
        console.warn(`A prova ${prova} possui menos que 3 inscritos e foi ignorada.`);
        ignoredProvas.push(`A prova ${prova} possui menos que 3 inscritos e foi ignorada.`);
        continue; // Pula esta prova e continua com as demais
      }
      
      try { // Processa a prova individualmente
        for (const [bateriaIndex, bateria] of baterias.entries()) {
          // Acessa o primeiro nadador para obter eventos_provas_id e inscricao_id
          const eventos_provas_id = bateria[0]?.eventos_provas_id;
          const inscricao_id = bateria[0]?.inscricao_id;

          if (!eventos_provas_id || !inscricao_id) {
            throw new Error(`Dados incompletos para a prova: ${prova}`);
          }

          // Alterado: usar "eventos_provas_id" conforme a estrutura da tabela "baterias"
          const [result] = await connection.query(
            `INSERT INTO baterias (descricao, eventos_id, eventos_provas_id) VALUES (?, ?, ?)`,
            [`Série ${bateriaIndex + 1}`, eventoId, eventos_provas_id]
          );        

          const bateriaId = result.insertId;

          for (const nadador of bateria) {
            const { nadador_id, piscina = 1, raia, inscricao_id } = nadador;

            if (!nadador_id || !raia) {
              throw new Error(`Dados incompletos para nadador na bateria ${bateriaId}.`);
            }

            await connection.query(
              `INSERT INTO baterias_inscricoes (baterias_id, inscricoes_id, piscina, raia) VALUES (?, ?, ?, ?)`,
              [bateriaId, inscricao_id, piscina, raia]
            );
          }
        }
      } catch (error) {
        console.error(`Erro ao processar a prova ${prova}:`, error);
        ignoredProvas.push(error.message);
        continue; // Ignora esta prova e continua com as demais
      }
    }

    await connection.commit();
    // Alterado: mensagem de retorno diferenciando garantidamente provas ignoradas
    res.status(200).json({ 
      success: true, 
      message: ignoredProvas.length 
        ? "Balizamento salvo, porém as seguintes provas foram ignoradas:\n" + ignoredProvas.join("\n") 
        : 'Balizamento salvo com sucesso!', 
      ignoredProvas 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao salvar balizamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar balizamento.', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
