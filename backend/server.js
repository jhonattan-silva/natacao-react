//importando módulos
const express = require('express');
const dotenv = require('dotenv'); //salva credenciais em outro arquivo
const app = express(); // backend/server.js
const db = require('./config/db');// Conexão com banco de dados
const cors = require('cors'); // Garante permissao de requisições front->backend
const bodyParser = require('body-parser'); //backend interpreta os json nas requisições
//const helmet = require('helmet'); // Helmet

// Definindo porta e inicializando dotenv
dotenv.config();
const port = process.env.PORT;

// Adicionando CORS e body-parser
const allowedOrigins = [
    'http://localhost:3000',     // Origem para desenvolvimento no desktop
    'http://192.168.1.110:3000', // Origem para dispositivos móveis na rede local
    'https://natacao-react.vercel.app/',    // Origem de produção
];

app.use(cors({
    origin: (origin, callback) => {
        // Permite origens específicas ou nenhuma origem (em desenvolvimento)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Permite envio de cookies, se necessário
}));

app.use(bodyParser.json());
//app.use(helmet()); // Ativando Helmet

app.get('/', (req, res) => {
  res.send(`'Backend está funcionando!'`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
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


// Página não encontrada
app.use((req, res) => {
  res.status(404).send('Desculpe, não pode passar por aqui!');
});


// Exportando conexão com banco de dados
module.exports = db;