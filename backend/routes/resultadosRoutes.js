const express = require('express');
const router = express.Router();

// Supondo que exista um módulo de conexão com o banco, por exemplo, db.js
const db = require('../db');

router.get('/obterResultados/:provaId', (req, res) => {
  const { provaId } = req.params;
  const query = `
    SELECT r.*, n.nome as nadadorNome 
    FROM resultados r
    LEFT JOIN nadadores n ON r.nadadores_id = n.id
    WHERE r.provas_id = ?
  `;
  db.query(query, [provaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar resultados:", err);
      return res.status(500).json({ error: "Erro ao buscar resultados" });
    }
    // Exemplo: envio da prova com um nome padrão (ou faça uma consulta separada para buscar os dados da prova)
    res.json({ 
      prova: { nome: `Prova ${provaId}` },
      resultados: results
    });
  });
});

module.exports = router;
