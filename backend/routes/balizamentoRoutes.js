const express = require('express');
const router = express.Router();
const db = require('../config/db');

//Listar todos EVENTOS
router.get('/listarEventos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM eventos WHERE inscricao_aberta = 1');
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
          CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' ', p.sexo) AS nome_prova,
          ep.ordem,
          n.nome AS nome,       -- Alterado: alias para "nome"
          n.data_nasc,         -- Adicionado: data de nascimento
          n.id AS nadador_id,
          COALESCE(r.tempo, '00:00') AS melhor_tempo, 
          i.id AS inscricao_id,
          e.nome AS equipe,
          c.nome AS categoria
      FROM inscricoes i
      INNER JOIN nadadores n ON i.nadadores_id = n.id
      INNER JOIN eventos_provas ep ON i.eventos_provas_id = ep.id
      INNER JOIN provas p ON ep.provas_id = p.id
      LEFT JOIN records r ON n.id = r.nadadores_id AND ep.provas_id = r.provas_id
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
            WHEN LOWER(CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' ', p.sexo)) LIKE '%revezamento%' 
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

    for (const [prova, baterias] of Object.entries(balizamento)) {
      // Verifica se a prova possui pelo menos 3 inscritos
      const totalInscritos = baterias.reduce((acc, bateria) => acc + bateria.length, 0);
      if (totalInscritos < 3) {
        throw new Error(`A prova ${prova} possui menos que 3 inscritos e não pode ser balizada.`);
      }

      for (const [bateriaIndex, bateria] of baterias.entries()) {
        // Acessa o primeiro nadador dentro do array aninhado para obter `prova_id` e `Nadadores_id`
        const prova_id = bateria[0]?.[0]?.prova_id;
        const inscricao_id = bateria[0]?.[0]?.inscricao_id;

        if (!prova_id || !inscricao_id) {
          console.error(`Erro: Dados incompletos para a prova: ${prova}`);
          console.error(`Dados da bateria:`, JSON.stringify(bateria, null, 2));
          throw new Error(`Dados incompletos para a prova: ${prova}`);
        }

        const [result] = await connection.query(
          `INSERT INTO baterias (descricao, Eventos_id, Provas_id) VALUES (?, ?, ?)`,
          [`Série ${bateriaIndex + 1}`, eventoId, prova_id]
        );        

        // Fechar inscrições para o evento
        await connection.query(
          `UPDATE eventos SET inscricao_aberta = 0 WHERE id = ?`,
          [eventoId]
        );

        const bateriaId = result.insertId;

        for (const nadadorData of bateria) {
          const nadador = nadadorData[0]; // Acessa o objeto do nadador
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
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Balizamento salvo com sucesso!' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao salvar balizamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar balizamento.', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
