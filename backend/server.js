const express = require('express');
const dotenv = require('dotenv'); // Salva credenciais em outro arquivo
const app = express();
const db = require('./config/db'); // Conexão com banco de dados
const cors = require('cors'); // CORS entre frontend e backend
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

// Carrega as variáveis de ambiente (certifique-se de que o caminho esteja correto)
dotenv.config({ path: '../../.env' });

// Define a porta (priorizando a variável de ambiente)
const port = process.env.PORT || 5000;

// Configuração de certificado para produção
const PROD_CERT_PATH = "/etc/letsencrypt/live/ligapaulistadenatacao.com.br/";

// Função para iniciar o servidor HTTP
const startHttpServer = () => {
  http.createServer(app).listen(port, () => {
    console.log(`Servidor HTTP rodando na porta ${port}`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
  });
};

// Função para iniciar o servidor HTTPS, tentando carregar os certificados
const startHttpsServer = (keyPath, certPath) => {
  try {
    const privateKey = fs.readFileSync(path.join(keyPath), "utf8");
    const certificate = fs.readFileSync(path.join(certPath), "utf8");
    const credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(port, () => {
      console.log(`Servidor HTTPS rodando na porta ${port}`);
      console.log(`Ambiente: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error("Certificados não encontrados. Executando servidor em HTTP.");
    startHttpServer();
  }
};

/* Inicializando o servidor com base no ambiente e variáveis de controle:
   1. Se DISABLE_SSL estiver definido (true), executa HTTP.
   2. Se estiver em produção, utiliza os certificados reais.
   3. Se estiver em desenvolvimento e os caminhos SSL estiverem informados, tenta
      iniciar o HTTPS local; caso contrário, utiliza HTTP.
*/
if (process.env.DISABLE_SSL === 'true') {
  console.log("SSL desabilitado. Iniciando servidor HTTP.");
  startHttpServer();
} else if (process.env.NODE_ENV === 'production') {
  // Em produção, utiliza os certificados do diretório padrão
  startHttpsServer(path.join(PROD_CERT_PATH, "privkey.pem"), path.join(PROD_CERT_PATH, "fullchain.pem"));
} else if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, tenta usar os certificados informados nas variáveis SSL_CERT_PATH/SSL_KEY_PATH,
  // se estiverem definidos; caso contrário, roda HTTP.
  if (process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
    startHttpsServer(process.env.SSL_KEY_PATH, process.env.SSL_CERT_PATH);
  } else {
    console.log("Certificados locais não configurados. Iniciando servidor HTTP.");
    startHttpServer();
  }
} else {
  // Default fallback
  startHttpServer();
}

// Configuração de CORS
const allowedOrigins = [
  'http://localhost',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://localhost',
  'https://localhost:8080',
  'https://localhost:3000',
  'https://www.ligapaulistadenatacao.com.br',
  'https://ligapaulistadenatacao.com.br'
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

// Configura o body parser com um limite maior para o JSON e urlencoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(helmet());

app.get('/', (req, res) => {
  res.send(`'Backend está funcionando!'`);
});

// Rotas da API
const authRoutes = require('./routes/authRoutes');
const balizamentoRoutes = require('./routes/balizamentoRoutes');
const equipesRoutes = require('./routes/equipesRoutes');
const etapasRoutes = require('./routes/etapasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const nadadoresRoutes = require('./routes/nadadoresRoutes');
const inscricaoRoutes = require('./routes/inscricaoRoutes');
const rankingsRoutes = require('./routes/rankingsRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes'); // Nova rota de uploads
const migracao = require('./routes/migracaoRoute');
const resultadosEntrada = require('./routes/resultadosEntradaRoutes');
const resultadosRoutes = require('./routes/resultadosRoutes');
const pontuacoesRoutes = require('./routes/pontuacoesRoutes');
const estatisticasRoutes = require('./routes/estatisticasRoutes');
const balizamentoExibicaoRoutes = require('./routes/balizamentoExibicaoRoutes');
const balizamentosAjusteRoutes = require('./routes/balizamentosAjusteRoutes');
const noticiasRoutes = require('./routes/noticiasRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/balizamento', balizamentoRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/nadadores', nadadoresRoutes);
app.use('/api/inscricao', inscricaoRoutes);
app.use('/api/rankings', rankingsRoutes.router); // Corrigido para usar o router do rankingsRoutes
app.use('/api/upload', uploadsRoutes); // Usando a nova rota de uploads
app.use('/api/migracao', migracao);
app.use('/api/resultadosEntrada', resultadosEntrada);
app.use('/api/resultados', resultadosRoutes.router); // Corrigido para usar o router do resultadosRoutes
app.use('/api/pontuacoes', pontuacoesRoutes.router); // Corrigido para usar o router do pontuacoesRoutes
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/balizamentoExibicao', balizamentoExibicaoRoutes);
app.use('/api/balizamentosAjuste', balizamentosAjusteRoutes);
app.use('/api/news', noticiasRoutes);

// Garante que o Nginx sirva /uploads/ diretamente para o frontend
// Substitui a chamada direta a express.static por middleware que adiciona headers CORS
// Melhorar o middleware para servir arquivos estáticos com CORS mais permissivo
app.use('/uploads', (req, res, next) => {
  // Headers CORS mais permissivos para imagens
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Headers adicionais para compatibilidade
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// Middleware para página não encontrada
app.use((req, res) => {
  res.status(404).send('Desculpe, não pode passar por aqui!');
});

// Exporta a conexão com o banco de dados
module.exports = db;