const express = require('express');
const router = express.Router();
const db = require('../config/db');

//Listar todos EVENTOS
router.get('/listarEventos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM eventos');
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
              n.nome AS nome_nadador,
              n.id AS nadador_id,
              COALESCE(r.tempo, 'Sem recorde') AS melhor_tempo,
              i.id AS inscricao_id
          FROM
              inscricoes i
          INNER JOIN nadadores n ON i.nadadores_id = n.id
          INNER JOIN eventos_provas ep ON i.eventos_provas_id = ep.id
          INNER JOIN provas p ON ep.provas_id = p.id
          LEFT JOIN records r ON n.id = r.nadadores_id AND ep.provas_id = r.provas_id
          WHERE
              i.eventos_id = ?
          ORDER BY p.estilo, p.distancia, p.tipo, p.sexo, r.tempo;
      `, [eventoId]);
    res.json(rows); // Retorna as inscrições com o ID da prova
  } catch (error) {
    console.error('Erro ao buscar inscritos:', error);
    res.status(500).send('Erro ao buscar inscrições');
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

      console.log("Dados recebidos no backend:", JSON.stringify(req.body, null, 2));

      for (const [prova, baterias] of Object.entries(balizamento)) {
          console.log(`Processando prova: ${prova}`);
          console.log(`Dados das baterias:`, JSON.stringify(baterias, null, 2));

          for (const [bateriaIndex, bateria] of baterias.entries()) {
              // Acessa o primeiro nadador dentro do array aninhado para obter `prova_id` e `Nadadores_id`
              const prova_id = bateria[0]?.[0]?.prova_id;
              const nadador_id = bateria[0]?.[0]?.nadador_id;
              const inscricao_id = bateria[0]?.[0]?.inscricao_id;

              if (!prova_id || !nadador_id || !inscricao_id) {
                  console.error(`Erro: Dados incompletos para a prova: ${prova}`);
                  console.error(`Dados da bateria:`, JSON.stringify(bateria, null, 2));
                  throw new Error(`Dados incompletos para a prova: ${prova}`);
              }

              console.log(`Inserindo bateria no banco para prova_id: ${prova_id} e nadador_id: ${nadador_id}`);

              const [result] = await connection.query(
                  `INSERT INTO baterias (descricao, Eventos_id, Provas_id, Nadadores_id) VALUES (?, ?, ?, ?)`,
                  [`Bateria ${bateriaIndex + 1}`, eventoId, prova_id, nadador_id]
              );

              const bateriaId = result.insertId;
              console.log(`Bateria ${bateriaId} inserida com sucesso para prova_id ${prova_id} e nadador_id ${nadador_id}.`);

              for (const nadadorData of bateria) {
                  const nadador = nadadorData[0]; // Acessa o objeto do nadador
                  const { nadador_id, piscina = 1, raia, inscricao_id } = nadador;

                  if (!nadador_id || !raia) {
                      throw new Error(`Dados incompletos para nadador na bateria ${bateriaId}.`);
                  }

                  console.log(`Inserindo nadador ${nadador_id} na bateria ${bateriaId} na raia ${raia} na piscina ${piscina}.`);

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
