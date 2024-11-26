const express = require('express');
const router = express.Router();
const db = require('../config/db');


// Rota para buscar resultados com filtro opcional por equipe
router.get('/resultados', async (req, res) => {
    const { equipe } = req.query;

    try {
        const query = equipe
            ? 'SELECT * FROM temp WHERE Equipe = ?'
            : 'SELECT * FROM temp';
        const [rows] = await db.query(query, [equipe].filter(Boolean));

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
    console.log('Acessando rota /listaEquipes'); // Log para verificar a chamada
    try {
        const [rows] = await pool.query('SELECT DISTINCT Equipe FROM temp WHERE Equipe IS NOT NULL');

        if (!Array.isArray(rows)) {
            console.error('Resposta inesperada de /listaEquipes:', rows);
            return res.json([]); // Retorna um array vazio para evitar problemas no frontend
        }

        const equipes = rows.map(row => ({ nome: row.Equipe }));
        res.json(equipes);
    } catch (error) {
        console.error('Erro ao listar equipes:', error);
        res.status(500).send('Erro ao listar equipes.');
    }
});



module.exports = router;
