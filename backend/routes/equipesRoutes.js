const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todas EQUIPES (incluindo equipes sem treinadores)
router.get('/listarEquipes', async (req, res) => {
  try {
    const [equipes] = await db.query(`
      SELECT e.nome AS Equipe, e.cidade AS Cidade, e.id AS id, e.ativo AS Ativo, u.nome AS Treinador 
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
  const { nome, cidade, treinadorId } = req.body;

  if (!treinadorId) {
    return res.status(400).send('Treinador não foi selecionado');
  }

  try {
    // Iniciar uma transação para garantir que ambas as operações sejam feitas
    await db.query('START TRANSACTION');

    // Insere a equipe e obtém o ID gerado
    const [resultEquipe] = await db.query('INSERT INTO equipes (nome, cidade) VALUES (?, ?)', [nome, cidade]);
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

// Rota para inativar/ativar equipe
router.put('/inativarEquipe/:id', async (req, res) => {
  const equipeId = req.params.id;
  const { ativo } = req.body;

  try {
    await db.query('UPDATE equipes SET ativo = ? WHERE id = ?', [ativo, equipeId]);
    res.status(200).json({ message: 'Status da equipe atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status da equipe:', error);
    res.status(500).json({ error: 'Ocorreu um erro ao atualizar o status da equipe. Por favor, tente novamente mais tarde.' });
  }
});

// Rota para atualizar uma equipe existente
router.put('/atualizarEquipe/:id', async (req, res) => {
  const equipeId = req.params.id;
  const { nome, cidade, treinadorId } = req.body;

  try {
    // Iniciar uma transação para garantir que ambas as operações sejam feitas
    await db.query('START TRANSACTION');

    // Atualiza a equipe
    await db.query('UPDATE equipes SET nome = ?, cidade = ? WHERE id = ?', [nome, cidade, equipeId]);

    // Atualiza o treinador (usuario_id) na tabela usuarios_equipes
    await db.query('DELETE FROM usuarios_equipes WHERE equipes_id = ?', [equipeId]);
    await db.query('INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)', [treinadorId, equipeId]);

    // Confirma a transação se tudo ocorrer bem
    await db.query('COMMIT');

    res.status(200).json({ message: 'Equipe atualizada com sucesso' });
  } catch (error) {
    // Se houver erro, desfaz a transação
    await db.query('ROLLBACK');
    console.error('Erro ao atualizar equipe:', error);
    res.status(500).json({ error: 'Ocorreu um erro ao atualizar a equipe. Por favor, tente novamente mais tarde.' });
  }
});

// Rota para buscar treinadores por nome
router.get('/listarTreinadores', async (req, res) => {
  try {
    const [treinadores] = await db.query(`SELECT nome, id FROM usuarios`);
    res.json(treinadores);
  } catch (error) {
    console.error('Erro ao buscar treinadores:', error);
    res.status(500).send('Erro ao buscar treinadores');
  }
});

router.get('/:id', async (req, res) => { // Rota para buscar uma equipe específica pelo ID
  try {
    const equipeId = req.params.id;

    const query = 'SELECT id, nome, cidade, ativo FROM equipes WHERE id = ?';
    const [equipe] = await db.query(query, [equipeId]);

    if (equipe.length === 0) {
      return res.status(404).json({ message: 'Equipe não encontrada' });
    }

    res.json(equipe[0]);
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).send('Erro ao buscar equipe');
  }
});

module.exports = router;
