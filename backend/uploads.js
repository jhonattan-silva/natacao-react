// Importando módulos necessários
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Criando um roteador do Express
const router = express.Router();

// Configuração do Multer para armazenar arquivos na pasta 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../frontend/public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Cria a pasta se não existir
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
  }
});

const upload = multer({ storage: storage });

// Função para converter o tempo para "hh:mm:ss"
function convertDecimalToTime(decimalTime) {
  const totalSeconds = Math.round(decimalTime * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Rota para fazer o upload do arquivo e transformá-lo em JSON
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  let jsonData = XLSX.utils.sheet_to_json(worksheet);

  // Converte o campo "Tempo" no formato "hh:mm:ss"
  jsonData = jsonData.map(row => ({
    ...row,
    Tempo: convertDecimalToTime(row['Tempo'] || 0)
  }));

  res.json(jsonData);
});

// Exporta o roteador configurado
module.exports = router;
