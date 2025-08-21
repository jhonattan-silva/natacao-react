const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path'); 

/*
Listar notícias (GET /)
Buscar notícia por ID (GET /:id)
Criar notícia (POST /)
Editar notícia (PUT /:id)
Deletar notícia (DELETE /:id)
/*/

// Helper para gerar slug a partir do título
function gerarSlug(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Listar todas as notícias (mais recentes primeiro)
router.get('/', async (req, res) => {
  try {
    // Se parâmetro 'all=true', retorna todas as notícias (para admin)
    const incluirRascunhos = req.query.all === 'true';
    const whereClause = incluirRascunhos ? '' : "WHERE status = 'publicada'";
    
    const [rows] = await db.execute(
      `SELECT id, titulo, subtitulo, resumo, imagem, data, status, galeria, slug 
       FROM noticias ${whereClause} ORDER BY data DESC, id DESC`
    );
    // Se galeria for string, converte para array
    rows.forEach(n => {
      if (n.galeria && typeof n.galeria === 'string') {
        try { n.galeria = JSON.parse(n.galeria); } catch { n.galeria = []; }
      }
    });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar notícias:', err);
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
});

// Rota para buscar notícia por ano e slug
router.get('/:year/:slug', async (req, res) => {
  const { year, slug } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT id, titulo, subtitulo, resumo, texto, imagem, data, status, galeria, slug
         FROM noticias WHERE YEAR(data) = ? AND slug = ?`,
      [year, slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const noticia = rows[0];
    if (noticia.galeria && typeof noticia.galeria === 'string') {
      try { noticia.galeria = JSON.parse(noticia.galeria); } catch { noticia.galeria = []; }
    }
    res.json(noticia);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícia.' });
  }
});

// Buscar notícia por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, titulo, subtitulo, resumo, texto, imagem, data, status, galeria, slug FROM noticias WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const noticia = rows[0];
    if (noticia.galeria && typeof noticia.galeria === 'string') {
      try { noticia.galeria = JSON.parse(noticia.galeria); } catch { noticia.galeria = []; }
    }
    res.json(noticia);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícia.' });
  }
});

// Criar notícia
router.post('/', async (req, res) => {
  try {
    let { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status, galeria, slug } = req.body;
    
    // Gera slug se não for fornecido
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      slug = gerarSlug(titulo);
    }
    
    // Se imagem vier como data URL (base64), salva no disco e substitui por caminho relativo
    if (imagem && typeof imagem === 'string' && imagem.startsWith('data:')) {
      // match usa regex para separar a data URL em duas partes:
      //  - primeiro grupo (match[1]): o tipo MIME, ex: "image/jpeg" (capturado por (image\/[...]))
      //  - segundo grupo (match[2]): os dados em base64 após "base64," (capturado por (.*))
      // Exemplo de data URL: "data:image/jpeg;base64,/9j/4AAQ...".
      const match = imagem.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
      if (match) {
        // match[1] => MIME type (ex: 'image/jpeg')
        const mime = match[1]; // tipo do arquivo (MIME)
        // match[2] => parte base64 (os bytes codificados em base64)
        const base64Data = match[2];
        // ext obtém a extensão a partir do MIME (converte 'jpeg' para 'jpg')
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
        // Pasta temp
        const uploadDir = path.join(__dirname, '../uploads/imagens', 'temp');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext;
        const filePath = path.join(uploadDir, filename);
        // Escreve arquivo
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        // Substitui imagem pelo caminho público relativo
        imagem = `/uploads/imagens/temp/${filename}`;
      }
    }

    // Validações mínimas
    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório.' });
    }

    // Garante que galeria seja um array
    const galeriaArr = Array.isArray(galeria) ? galeria : []; 
    const galeriaStr = JSON.stringify(galeriaArr);

    const usuariosIdFinal = usuarios_id || 1;

    console.log('Criando notícia com payload:', { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id: usuariosIdFinal, status, galeria: galeriaArr, slug });

    const [result] = await db.execute(
      `INSERT INTO noticias (titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status, galeria, slug)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, subtitulo || null, resumo || null, texto || null, imagem || null, data || null, usuariosIdFinal, status || 'publicada', galeriaStr, slug]
    );

    const noticiaId = result.insertId;

    // Mover arquivos temp -> pasta da notícia e atualizar caminhos
    const noticiaAno = data ? new Date(data).getFullYear().toString() : 'temp';
    const noticiaDir = path.join(__dirname, '../uploads/imagens', noticiaAno, slug);
    // garante pasta da notícia
    if (!fs.existsSync(noticiaDir)) fs.mkdirSync(noticiaDir, { recursive: true });

    // Função utilitária para mover arquivos temp para a pasta definitiva
    const moveIfTemp = (publicPath) => {
      if (!publicPath || typeof publicPath !== 'string') return publicPath;
      const marker = '/uploads/imagens/temp/';
      if (!publicPath.includes(marker)) return publicPath;
      const filename = path.basename(publicPath);
      const caminhoTemporario = path.join(__dirname, '../uploads/imagens', 'temp', filename);
      const caminhoDestino = path.join(noticiaDir, filename);
      const caminhoNovo = `/uploads/imagens/${noticiaAno}/${slug}/${filename}`;
      try {
        if (fs.existsSync(caminhoTemporario)) {
          fs.renameSync(caminhoTemporario, caminhoDestino); // move o arquivo
        } else {
          console.warn(`Arquivo temp não encontrado ao mover: ${caminhoTemporario}`);
        }
      } catch (err) {
        console.error('Erro movendo arquivo temp -> noticia:', err);
      }
      return caminhoNovo;
    };

    // Mover imagem principal se for temp
    let imagemFinal = imagem;
    if (imagem && imagem.includes('/uploads/imagens/temp/')) {
      imagemFinal = moveIfTemp(imagem);
    }
    // Mover galeria
    const galeriaFinal = galeriaArr.map(item => {
      if (typeof item === 'string' && item.includes('/uploads/imagens/temp/')) {
        return moveIfTemp(item);
      }
      return item;
    });

    try {
      await db.execute(
        `UPDATE noticias SET imagem=?, galeria=? WHERE id=?`,
        [imagemFinal || null, JSON.stringify(galeriaFinal || []), noticiaId]
      );
    } catch (err) {
      console.error('Erro ao atualizar caminhos finais da notícia:', err);
    }

    res.status(201).json({ success: 'Notícia criada com sucesso!', id: noticiaId });
  } catch (err) {
    console.error('Erro ao criar notícia:', err);
    const message = process.env.NODE_ENV === 'production' ? 'Erro ao criar notícia.' : err.message;
    res.status(500).json({ error: message });
  }
});

// Editar notícia
router.put('/:id', async (req, res) => {
  try {
    const { titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status, galeria, slug } = req.body;
    await db.execute(
      `UPDATE noticias SET titulo=?, subtitulo=?, resumo=?, texto=?, imagem=?, data=?, usuarios_id=?, status=?, galeria=?, slug=? WHERE id=?`,
      [titulo, subtitulo, resumo, texto, imagem, data, usuarios_id, status, JSON.stringify(galeria || []), slug || gerarSlug(titulo), req.params.id]
    );
    res.json({ success: 'Notícia atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar notícia.' });
  }
});

// Deletar notícia
router.delete('/:id', async (req, res) => {
  try {
    // Busca a notícia para obter o ano e o slug antes de deletar
    const [rows] = await db.execute(
      `SELECT data, slug FROM noticias WHERE id=?`, [req.params.id]
    );
    let pastaImagens = null;
    if (rows.length > 0) {
      const noticia = rows[0];
      if (noticia.data && noticia.slug) {
        const ano = new Date(noticia.data).getFullYear().toString();
        pastaImagens = path.join(__dirname, '../uploads/imagens', ano, noticia.slug);
      }
    }

    await db.execute(`DELETE FROM noticias WHERE id=?`, [req.params.id]);

    // Excluir a pasta de imagens da notícia (por ano/slug)
    if (pastaImagens && fs.existsSync(pastaImagens)) {
      fs.rmSync(pastaImagens, { recursive: true, force: true });
      console.log(`Pasta ${pastaImagens} excluída com sucesso.`);
    }

    res.json({ success: 'Notícia excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir notícia.' });
  }
});

module.exports = router;