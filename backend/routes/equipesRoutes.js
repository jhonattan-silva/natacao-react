const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todas EQUIPES (incluindo equipes sem treinadores)
router.get('/listarEquipes', async (req, res) => {
  try {
    const [equipes] = await db.query(`
      SELECT e.nome AS Equipe, e.cidade AS Cidade, e.id AS id, e.ativo AS Ativo, e.logo AS logo, u.nome AS Treinador 
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
  const { nome, cidade, treinadorId, logo } = req.body;

  try {
    // Iniciar uma transação para garantir que ambas as operações sejam feitas
    await db.query('START TRANSACTION');

    // Insere a equipe e obtém o ID gerado
    const [resultEquipe] = await db.query('INSERT INTO equipes (nome, cidade, logo) VALUES (?, ?, ?)', [nome, cidade, logo || null]);
    const equipeId = resultEquipe.insertId;

    // Se um treinador foi informado, cria o vínculo na tabela usuarios_equipes
    // Remove vínculo anterior do treinador com outra equipe (um treinador só pode ter uma equipe)
    if (treinadorId) {
      await db.query('DELETE FROM usuarios_equipes WHERE usuarios_id = ?', [treinadorId]);
      await db.query(
        'INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)',
        [treinadorId, equipeId]
      );
    }

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
  const { nome, cidade, treinadorId, logo } = req.body;

  try {
    // Iniciar uma transação para garantir que ambas as operações sejam feitas
    await db.query('START TRANSACTION');

    // Atualiza a equipe
    await db.query('UPDATE equipes SET nome = ?, cidade = ?, logo = ? WHERE id = ?', [nome, cidade, logo || null, equipeId]);

    // Remove vínculo atual da equipe
    await db.query('DELETE FROM usuarios_equipes WHERE equipes_id = ?', [equipeId]);

    // Se for informado um treinador válido, insere novo vínculo
    // Remove vínculo anterior do treinador com outra equipe (um treinador só pode ter uma equipe)
    if (treinadorId) {
      await db.query('DELETE FROM usuarios_equipes WHERE usuarios_id = ?', [treinadorId]);
      await db.query('INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)', [treinadorId, equipeId]);
    }

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

// Rota para verificar se um treinador já está vinculado a alguma equipe
router.get('/verificarTreinadorUsuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const [resultado] = await db.query(`
      SELECT e.id, e.nome 
      FROM usuarios_equipes ue
      JOIN equipes e ON ue.equipes_id = e.id
      WHERE ue.usuarios_id = ?
    `, [usuarioId]);
    
    if (resultado.length > 0) {
      res.json({ temEquipe: true, equipe: resultado[0] });
    } else {
      res.json({ temEquipe: false });
    }
  } catch (error) {
    console.error('Erro ao verificar equipe do treinador:', error);
    res.status(500).json({ error: 'Erro ao verificar equipe' });
  }
});

// Rota para verificar se uma equipe já tem treinador
router.get('/verificarTreinadorEquipe/:equipeId', async (req, res) => {
  try {
    const { equipeId } = req.params;
    const [resultado] = await db.query(`
      SELECT u.id, u.nome 
      FROM usuarios_equipes ue
      JOIN usuarios u ON ue.usuarios_id = u.id
      WHERE ue.equipes_id = ?
    `, [equipeId]);
    
    if (resultado.length > 0) {
      res.json({ temTreinador: true, treinador: resultado[0] });
    } else {
      res.json({ temTreinador: false });
    }
  } catch (error) {
    console.error('Erro ao verificar treinador da equipe:', error);
    res.status(500).json({ error: 'Erro ao verificar treinador' });
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
