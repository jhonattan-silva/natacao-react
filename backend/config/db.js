const mysql = require('mysql2/promise');
require('dotenv').config();

/* //adicionado pool para suporte a promise
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
 */

// Configuração do banco com base no ambiente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
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

module.exports = pool;