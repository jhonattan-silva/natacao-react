const express = require('express');
const dotenv = require('dotenv'); //salva credenciais em outro arquivo
const app = express(); // backend/server.js
const db = require('./config/db');// Conexão com banco de dados
const cors = require('cors'); // Garante permissao de requisições front->backend
const bodyParser = require('body-parser'); //backend interpreta os json nas requisições
const https = require('https'); // Para servir o frontend em produção
const http = require('http'); // Para servidor HTTP local
const helmet = require('helmet'); // Helmet para defesa http
const fs = require('fs'); // Para carregar certificados SSL
const path = require('path'); // Para lidar com caminhos de arquivos

// Definindo porta e inicializando dotenv
dotenv.config({ path: '../../.env' });  // Carrega variáveis de ambiente
const port = process.env.PORT || 5000;

/* // Carregando certificados SSL desenvolvimento
const privateKey = fs.readFileSync(path.join(__dirname, '../certificados/privkey.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '../certificados/fullchain.pem'), 'utf8');
const credentials = { key: privateKey, cert: certificate }; */

// Caminhos dos certificados no container
const CERT_PATH = "/etc/letsencrypt/live/ligapaulistadenatacao.com.br/";


const privateKey = fs.readFileSync(path.join(CERT_PATH, "privkey.pem"), "utf8");
const certificate = fs.readFileSync(path.join(CERT_PATH, "fullchain.pem"), "utf8");
const credentials = { key: privateKey, cert: certificate };
try {
  https.createServer(credentials, app).listen(port, () => {
    console.log(`Servidor HTTPS rodando`);
  });
} catch (err) {
  console.error("Certificados não encontrados. Executando servidor em HTTP.");
  http.createServer(app).listen(port, () => {
    console.log(`Servidor HTTP rodando`);
  });
}



// Adicionando CORS e body-parser
const allowedOrigins = [
  'https://localhost',                 // Adicione esta linha (sem porta)
  'https://localhost:8080',            // Para desenvolvimento local
  'https://localhost:3000',            // Para desenvolvimento local
  'https://www.ligapaulistadenatacao.com.br', // Para produção
  'https://ligapaulistadenatacao.com.br', // Para produção
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(helmet()); // Ativando Helmet

app.get('/', (req, res) => {
  res.send(`'Backend está funcionando!'`);
});

// Inicializando servidor HTTPS ou HTTP, dependendo do ambiente
/* if (process.env.NODE_ENV === 'production') {
  // Em produção, usamos HTTPS
  https.createServer(credentials, app).listen(port, () => {
    console.log(`Servidor HTTPS rodando na porta ${port}`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
    console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
  });
} else {
  // Em desenvolvimento, usamos HTTP
  http.createServer(app).listen(port, () => {
    console.log(`Servidor HTTP rodando na porta ${port}`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
    console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
  });
} */

// Importando e utilizando rotas
const authRoutes = require('./routes/authRoutes');
const balizamentoRoutes = require('./routes/balizamentoRoutes');
const equipesRoutes = require('./routes/equipesRoutes');
const etapasRoutes = require('./routes/etapasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const nadadoresRoutes = require('./routes/nadadoresRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');
const rankingsRoutes = require('./routes/rankingsRoutes');
const uploadRoutes = require('./uploads'); // Importa o arquivo uploads.js
const migracao = require('./routes/migracaoRoute'); //rota para ajudar na migração dos dados
const resultadosEntrada = require('./routes/resultadosEntradaRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/balizamento', balizamentoRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/nadadores', nadadoresRoutes);
app.use('/api/inscricao', inscricaoRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use(uploadRoutes); // Adiciona as rotas de upload
app.use('/api/migracao', migracao);
app.use('/api/resultadosEntrada', resultadosEntrada);

// Servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend', 'build')));

  // Captura todas as requisições que não sejam da API e serve o React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// Página não encontrada
app.use((req, res) => {
  res.status(404).send('Desculpe, não pode passar por aqui!');
});

// Exportando conexão com banco de dados
module.exports = db;
