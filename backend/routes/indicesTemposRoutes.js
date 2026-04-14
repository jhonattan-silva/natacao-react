const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

/*
 * ROTAS PARA GERENCIAR ÍNDICES DE TEMPOS DE PROVAS
 * 
 * GET    /listar                    - Listar todos os índices ativos
 * GET    /por-prova/:provaId        - Buscar índice de uma prova específica
 * POST   /criar                     - Criar novo índice
 * PUT    /:id                       - Atualizar índice existente
 * DELETE /:id                       - Remover índice (soft delete)
 * GET    /completo                  - Listar índices com informações das provas
 */

// Middleware de autenticação e autorização (apenas master/admin)
router.use(authMiddleware);
router.use(roleMiddleware(['master', 'admin']));

/**
 * GET /listar
 * Listar todos os índices de tempos ativos com informações das provas
 */
router.get('/listar', async (req, res) => {
  try {
    const [indices] = await db.query(`
      SELECT 
        i.id,
        i.provas_id,
        i.tempo_indice,
        i.descricao,
        i.ativo,
        i.criado_em,
        i.atualizado_em,
        p.distancia,
        p.estilo,
        p.sexo,
        CONCAT(p.distancia, 'm ', p.estilo, ' - ', p.sexo) AS nome_prova
      FROM IndicesTempos i
      JOIN provas p ON i.provas_id = p.id
      WHERE i.ativo = 1
      ORDER BY p.distancia ASC, p.estilo ASC, p.sexo ASC
    `);

    res.json({ success: true, dados: indices });
  } catch (error) {
    console.error('Erro ao listar índices:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar índices',
      details: error.message
    });
  }
});

/**
 * GET /por-prova/:provaId
 * Buscar índice de uma prova específica
 */
router.get('/por-prova/:provaId', async (req, res) => {
  const { provaId } = req.params;

  try {
    const [indice] = await db.query(
      `SELECT * FROM IndicesTempos 
       WHERE provas_id = ? AND ativo = 1 
       LIMIT 1`,
      [provaId]
    );

    if (indice.length === 0) {
      return res.json({ success: true, dados: null, mensagem: 'Nenhum índice configurado para esta prova' });
    }

    res.json({ success: true, dados: indice[0] });
  } catch (error) {
    console.error('Erro ao buscar índice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar índice',
      details: error.message
    });
  }
});

/**
 * POST /criar
 * Criar novo índice para uma prova
 * Body: { provaId, tempoIndice (MM:SS:CC), descricao }
 */
router.post('/criar', async (req, res) => {
  const { provaId, tempoIndice, descricao } = req.body;

  // Validações
  if (!provaId || !tempoIndice) {
    return res.status(400).json({
      success: false,
      message: 'provaId e tempoIndice são obrigatórios'
    });
  }

  try {
    // Verificar se a prova existe
    const [prova] = await db.query('SELECT * FROM provas WHERE id = ?', [provaId]);
    if (prova.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prova não encontrada'
      });
    }

    // Verificar se já existe índice para esta prova
    const [existente] = await db.query(
      'SELECT id FROM IndicesTempos WHERE provas_id = ? AND ativo = 1',
      [provaId]
    );

    if (existente.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um índice ativo para esta prova. Use o endpoint PUT para atualizar.'
      });
    }

    // Inserir novo índice
    const [resultado] = await db.query(
      `INSERT INTO IndicesTempos (provas_id, tempo_indice, descricao, ativo)
       VALUES (?, ?, ?, 1)`,
      [provaId, tempoIndice, descricao || null]
    );

    res.status(201).json({
      success: true,
      message: 'Índice criado com sucesso',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Erro ao criar índice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar índice',
      details: error.message
    });
  }
});

/**
 * PUT /:id
 * Atualizar índice existente
 * Body: { tempoIndice, descricao }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { tempoIndice, descricao } = req.body;

  if (!tempoIndice) {
    return res.status(400).json({
      success: false,
      message: 'tempoIndice é obrigatório'
    });
  }

  try {
    // Verificar se o índice existe
    const [indice] = await db.query('SELECT * FROM IndicesTempos WHERE id = ?', [id]);
    if (indice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Índice não encontrado'
      });
    }

    // Atualizar índice
    await db.query(
      `UPDATE IndicesTempos 
       SET tempo_indice = ?, descricao = ?
       WHERE id = ?`,
      [tempoIndice, descricao || null, id]
    );

    res.json({
      success: true,
      message: 'Índice atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar índice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar índice',
      details: error.message
    });
  }
});

/**
 * DELETE /:id
 * Remover índice (soft delete - marca como inativo)
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o índice existe
    const [indice] = await db.query('SELECT * FROM IndicesTempos WHERE id = ?', [id]);
    if (indice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Índice não encontrado'
      });
    }

    // Soft delete - marcar como inativo
    await db.query('UPDATE IndicesTempos SET ativo = 0 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Índice removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover índice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover índice',
      details: error.message
    });
  }
});

/**
 * GET /listar-provas
 * Listar todas as provas disponíveis para configurar índices
 */
router.get('/listar-provas', async (req, res) => {
  try {
    const [provas] = await db.query(`
      SELECT 
        p.id,
        p.distancia,
        p.estilo,
        p.sexo,
        CONCAT(p.distancia, 'm ', p.estilo, ' - ', p.sexo) AS nome_prova,
        i.id AS indice_id,
        i.tempo_indice,
        i.ativo
      FROM provas p
      LEFT JOIN IndicesTempos i ON p.id = i.provas_id AND i.ativo = 1
      WHERE p.distancia IN (200, 400)
      ORDER BY p.distancia ASC, p.estilo ASC, p.sexo ASC
    `);

    res.json({ success: true, dados: provas });
  } catch (error) {
    console.error('Erro ao listar provas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar provas',
      details: error.message
    });
  }
});

module.exports = router;
