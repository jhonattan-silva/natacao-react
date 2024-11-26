const express = require('express');
const dotenv = require('dotenv'); //salva credenciais em outro arquivo
const app = express(); // backend/server.js
const db = require('./config/db');// Conexão com banco de dados
const cors = require('cors'); // Garante permissao de requisições front->backend
const bodyParser = require('body-parser'); //backend interpreta os json nas requisições
//const helmet = require('helmet'); // Helmet

// Definindo porta e inicializando dotenv
dotenv.config();
const port = process.env.PORT || 5000;

// Adicionando CORS e body-parser
const allowedOrigins = [
    'http://localhost:3000',            // Para desenvolvimento local
    'https://natacao-react.vercel.app' // Para produção
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
//app.use(helmet()); // Ativando Helmet

app.get('/', (req, res) => {
  res.send(`'Backend está funcionando!'`);
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
});

// Importando e utilizando rotas
const balizamentoRoutes = require('./routes/balizamentoRoutes');
const equipesRoutes = require('./routes/equipesRoutes');
const etapasRoutes = require('./routes/etapasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const nadadoresRoutes = require('./routes/nadadoresRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');
const rankingsRoutes = require('./routes/rankingsRoutes');
const uploadRoutes = require('./uploads'); // Importa o arquivo uploads.js
const migracao = require('./routes/migracaoRoute'); //rota para ajudar na migração dos dados

app.use('/api/balizamento', balizamentoRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/nadadores', nadadoresRoutes);
app.use('/api/inscricao', inscricaoRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use(uploadRoutes); // Adiciona as rotas de upload
app.use('/api/migracao', migracao);

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