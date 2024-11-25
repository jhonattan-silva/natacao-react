const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const app = express(); // backend/server.js

const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:3000', 'https://natacao-react.vercel.app'], // Ajuste para os domínios corretos
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Configuração do banco (só para teste)
const pool = mysql.createPool({
    host: 'blugeddj68mfwddszfyw-mysql.services.clever-cloud.com', 
    user: 'u7zv9tojrhhp4uit',           
    password: 'ceePfgbPJuVpdWHK550X',        
    database: 'blugeddj68mfwddszfyw',         
    port: 3306,                  
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});




// Rota para buscar resultados com filtro opcional por equipe
router.get('/resultados', async (req, res) => {
    const { equipe } = req.query;

    try {
        const query = equipe
            ? 'SELECT * FROM temp WHERE Equipe = ?'
            : 'SELECT * FROM temp';
        const [rows] = await pool.query(query, [equipe].filter(Boolean));

        if (!Array.isArray(rows)) {
            console.error('Resposta inesperada de /resultados:', rows);
            return res.json([]); // Retorna um array vazio para evitar problemas no frontend
        }

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        res.status(500).send('Erro ao buscar resultados.');
    }
});


// Rota para listar equipes únicas
router.get('/listaEquipes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT DISTINCT Equipe FROM temp WHERE Equipe IS NOT NULL');
        
        if (!Array.isArray(rows)) {
            console.error('Resposta inesperada de /listaEquipes:', rows);
            return res.json([]); // Garante que um array seja retornado
        }

        const equipes = rows.map(row => ({ nome: row.Equipe }));
        res.json(equipes);
    } catch (error) {
        console.error('Erro ao listar equipes:', error);
        res.status(500).send('Erro ao listar equipes.');
    }
});


module.exports = router;
