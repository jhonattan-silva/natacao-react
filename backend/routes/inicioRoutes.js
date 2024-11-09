const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para BUSCAR TODOS EVENTOS
router.get('/listarEtapas', async (req, res) => {
    try {
        // Consulta com JOIN para buscar o nome do torneio
        const [etapas] = await db.query(`
            SELECT eventos.*, torneios.nome AS Torneio
            FROM eventos
            JOIN torneios ON eventos.Torneios_id = torneios.id
        `);

        res.json(etapas);
    } catch (error) {
        console.error('Erro ao buscar etapas:', error);
        res.status(500).json({ error: 'Erro ao buscar etapas' });
    }
});


module.exports = router;