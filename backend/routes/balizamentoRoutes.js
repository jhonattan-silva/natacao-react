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

//listar todos INSCRITOS em determinado Evento
router.get('/listarInscritos/:eventoId', async (req, res) => {
    const { eventoId } = req.params;
    if (!eventoId) {
      return res.status(400).send('Evento ID é necessário');
    }
    try {
      const [rows] = await db.query(`
        SELECT 
          CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' ', p.sexo) AS nome_prova,
          n.nome AS nome_nadador,
          COALESCE(r.tempo, 'Sem recorde') AS melhor_tempo
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
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar inscritos:', error);
      res.status(500).send('Erro ao buscar inscrições');
    }
  });
  
module.exports = router;
