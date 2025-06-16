const express = require('express');
const router = express.Router();
const db = require('../config/db');

/*
Listar notícias (GET /news)
Buscar notícia por ID (GET /news/:id)
Criar notícia (POST /news)
Editar notícia (PUT /news/:id)
Deletar notícia (DELETE /news/:id)
/*/

// Listar todas as notícias (mais recentes primeiro)
router.get('/news', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, titulo, subtitulo, resumo, imagem, data, status FROM noticias WHERE status = 'publicada' ORDER BY data DESC, id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
});

// Buscar notícia por ID
router.get('/news/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, titulo, subtitulo, resumo, texto, imagem, data, status FROM noticias WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Notícia não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícia.' });
  }
});

// Criar notícia
router.post('/news', async (req, res) => {
  try {
    const { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status } = req.body;
    await db.execute(
      `INSERT INTO noticias (titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status || 'publicada']
    );
    res.status(201).json({ success: 'Notícia criada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar notícia.' });
  }
});

// Editar notícia
router.put('/news/:id', async (req, res) => {
  try {
    const { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status } = req.body;
    await db.execute(
      `UPDATE noticias SET titulo=?, subtitulo=?, resumo=?, texto=?, imagem=?, data=?, usuarios_id=?, status=? WHERE id=?`,
      [titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status, req.params.id]
    );
    res.json({ success: 'Notícia atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar notícia.' });
  }
});

// Deletar notícia
router.delete('/news/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM noticias WHERE id=?`, [req.params.id]);
    res.json({ success: 'Notícia excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir notícia.' });
  }
});

module.exports = router;