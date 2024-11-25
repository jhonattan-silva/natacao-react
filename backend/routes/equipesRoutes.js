const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todas EQUIPES (incluindo equipes sem treinadores)
router.get('/listarEquipes', async (req, res) => {
  try {
    const [equipes] = await db.query(`
      SELECT e.nome AS Equipe, e.id AS id, u.nome AS Treinador 
      FROM equipes e 
      LEFT JOIN usuarios_equipes ue ON e.id = ue.equipes_id 
      LEFT JOIN usuarios u ON ue.usuarios_id = u.id
    `);
    res.json(equipes);
  } catch (error) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).send('Erro ao buscar equipes');
  }
});



router.post('/cadastrarEquipe', async (req, res) => {
  const { nome, treinadorId } = req.body;

  if (!treinadorId) {
    return res.status(400).send('Treinador não foi selecionado');
  }

  try {
    // Iniciar uma transação para garantir que ambas as operações sejam feitas
    await db.query('START TRANSACTION');

    // Insere a equipe e obtém o ID gerado
    const [resultEquipe] = await db.query('INSERT INTO equipes (nome) VALUES (?)', [nome]);
    const equipeId = resultEquipe.insertId;

    // Insere o treinador (usuario_id) na tabela usuarios_equipes com a equipe recém-criada
    const [resultUsuarioEquipe] = await db.query(
      'INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)',
      [treinadorId, equipeId]
    );

    // Confirma a transação se tudo ocorrer bem
    await db.query('COMMIT');

    res.status(201).json({ message: 'Equipe e associação com treinador adicionadas com sucesso', nome });
  } catch (error) {
    // Se houver erro, desfaz a transação
    await db.query('ROLLBACK');
    console.error('Erro ao adicionar equipe:', error);
    res.status(500).json({ error: 'Ocorreu um erro ao adicionar a equipe. Por favor, tente novamente mais tarde.' });
  }
});


//Rota para buscar treinadores por nome
router.get('/listarTreinadores', async (req, res) => {
  const query = req.query.query;
  try {
      const [treinadores] = await db.query(`
          SELECT *
          FROM usuarios`);

      res.json(treinadores);
  } catch (error) {
      console.error('Erro ao buscar treinadores:', error);
      res.status(500).send('Erro ao buscar treinadores');
  }
});

module.exports = router;
