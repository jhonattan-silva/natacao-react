const mysql = require('mysql2/promise');
require('dotenv').config();

/* // Verificar se as variáveis de ambiente estão sendo carregadas corretamente
console.log('DB_HOST:', process.env.MYSQL_DB_HOST);
console.log('DB_USER:', process.env.MYSQL_USER);
console.log('DB_PASS:', process.env.MYSQL_PASSWORD);
console.log('DB_NAME:', process.env.MYSQL_DATABASE);
console.log('DB_PORT:', process.env.MYSQL_DB_PORT); */

// Configuração do banco com base no ambiente
const pool = mysql.createPool({
    host: process.env.MYSQL_DB_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_DB_PORT || 3306,
    charset: 'utf8mb4', // Configuração da codificação
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
});

pool.getConnection()
  .then(connection => {
    console.log('Conectado ao banco de dados. SHOW');
    connection.release();
  })
  .catch(err => {
    console.error('Vish! Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  });

/*/ Para lidar com eventos do pool
pool.on('connection', (connection) => {
  console.log('Nova conexão criada no pool.');
  connection.on('error', (err) => {
    console.error('Erro na conexão do MySQL:', err);
  });
});

pool.on('acquire', () => {
  console.log('Conexão adquirida do pool.');
});

pool.on('release', () => {
  console.log('Conexão liberada de volta ao pool.');
});
*/
module.exports = pool;
