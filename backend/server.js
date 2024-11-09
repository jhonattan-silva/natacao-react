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
app.use(cors());
app.use(bodyParser.json());
//app.use(helmet()); // Ativando Helmet

app.get('/', (req, res) => {
  res.send('Backend está funcionando!');
});

app.listen(port, () => {
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

app.use('/api/balizamento', balizamentoRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/nadadores', nadadoresRoutes);
app.use('/api/inscricao', inscricaoRoutes);
app.use('/api/ranking', rankingsRoutes);


// Página não encontrada
app.use((req, res) => {
  res.status(404).send('Desculpe, não pode passar por aqui!');
});

// Exportando conexão com banco de dados
module.exports = db;