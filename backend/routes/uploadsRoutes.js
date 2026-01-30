const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

//Função para criar nova pasta para imagens caso ainda não exista
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Storage para imagens de notícias
const storageNoticias = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usa o noticiaAno e noticiaSlug se fornecidos; caso contrário, usa 'temp'
    const noticiaAno = req.body.noticiaAno;
    const noticiaSlug = req.body.noticiaSlug;
    let uploadPath;
    if (noticiaAno && noticiaSlug) {
      uploadPath = path.join(__dirname, '../uploads/imagens', noticiaAno.toString(), noticiaSlug);
    } else {
      uploadPath = path.join(__dirname, '../uploads/imagens', 'temp');
    }
    ensureDir(uploadPath);
    cb(null, uploadPath); // Chama a função de callback com o caminho de upload
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const uploadNoticias = multer({ storage: storageNoticias });

// Storage para imagens de nadadores
const storageNadadores = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/nadadores');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const uploadNadadores = multer({ storage: storageNadadores });

// Storage para logos de equipes
const storageEquipes = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/equipes');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const uploadEquipes = multer({ storage: storageEquipes });

// Storage para regulamentos (PDF)
const storageRegulamento = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/regulamentos');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `regulamento${ext}`);
  }
});

const uploadRegulamento = multer({
  storage: storageRegulamento,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Apenas arquivos PDF são permitidos'));
    }
    cb(null, true);
  }
});

// Rota para upload de imagem de notícia
router.post('/noticia', uploadNoticias.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  // Se foi enviado noticiaAno e noticiaSlug, use-os; caso contrário, use 'temp'
  const noticiaAno = req.body.noticiaAno || 'temp';
  const noticiaSlug = req.body.noticiaSlug || 'temp';
  const url = `/uploads/imagens/${noticiaAno}/${noticiaSlug}/${req.file.filename}`;
  res.json({ url });
});

// Rota para upload de imagem de nadador
router.post('/nadador', uploadNadadores.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  const url = `/uploads/nadadores/${req.file.filename}`;
  res.json({ url });
});

// Rota para upload de logo de equipe
router.post('/equipe', uploadEquipes.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  const url = `/uploads/equipes/${req.file.filename}`;
  res.json({ url });
});

// Rota para upload de regulamento (PDF)
router.post('/regulamento', uploadRegulamento.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  console.log('✅ Regulamento salvo em:', req.file.path);
  const url = `/uploads/regulamentos/${req.file.filename}`;
  console.log('✅ URL retornada:', url);
  res.json({ url });
});

// Rota para obter regulamento atual
router.get('/regulamento', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/regulamentos/regulamento.pdf');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Regulamento não encontrado.' });
  }
  return res.json({ url: '/uploads/regulamentos/regulamento.pdf' });
});

// Rota para deletar regulamento (remove todos os PDFs)
router.delete('/regulamento', (req, res) => {
  const dirPath = path.join(__dirname, '../uploads/regulamentos');
  if (!fs.existsSync(dirPath)) {
    return res.status(200).json({ message: 'Nenhum regulamento encontrado.' });
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  return res.status(200).json({ message: 'Regulamento deletado com sucesso.' });
});

// Rota para mover imagem temporária da galeria/capa para pasta definitiva da notícia
router.post('/noticia/move', (req, res) => {
  const { imagemTemp, noticiaAno, noticiaSlug } = req.body;
  console.log('POST /api/upload/noticia/move called', { imagemTemp, noticiaAno, noticiaSlug });
  if (!imagemTemp || !noticiaAno || !noticiaSlug) {
    return res.status(400).json({ error: 'imagemTemp, noticiaAno e noticiaSlug são obrigatórios.' });
  }
  const filename = path.basename(imagemTemp);
  const srcDir = path.join(__dirname, '../uploads/imagens', 'temp');
  const srcPath = path.join(srcDir, filename);
  const destDir = path.join(__dirname, '../uploads/imagens', noticiaAno.toString(), noticiaSlug);
  const destPath = path.join(destDir, filename);

  // Se o arquivo não existir, apenas retorna o novo caminho para atualizar o registro
  if (!fs.existsSync(srcPath)) {
    console.warn('Arquivo temporário não encontrado:', srcPath);
    const url = `/uploads/imagens/${noticiaAno}/${noticiaSlug}/${filename}`;
    return res.json({ url });
  }

  ensureDir(destDir);
  fs.rename(srcPath, destPath, (err) => {
    if (err) {
      console.error('Erro ao mover arquivo:', err);
      return res.status(500).json({ error: 'Erro ao mover arquivo.' });
    }
    const url = `/uploads/imagens/${noticiaAno}/${noticiaSlug}/${filename}`;
    return res.json({ url });
  });
});

module.exports = router;