const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/listarEventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos');
        res.json(rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos ==> ', erro);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar eventos',
            details: erro.message, // Adiciona detalhes do erro para debug
        });
    }
})

router.get('/listarProvasEvento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        const query = `
            SELECT DISTINCT
                ep.id as id,
                ep.id AS eventos_provas_id,
                p.id AS prova_id,
                CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' (', p.sexo, ')') AS nome,
                p.estilo AS prova_estilo,
                p.distancia,
                p.tipo,
                p.sexo
            FROM 
                inscricoes i
            JOIN 
                eventos_provas ep ON i.Eventos_Provas_id = ep.id
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                i.Eventos_id = ?;
        `;
        const [rows] = await db.query(query, [eventoId]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar provas do evento:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar as provas.' });
    }
});

router.get('/listarBateriasProva/:provaId', async (req, res) => {
    const { provaId } = req.params;

    try {
        const query=`
        
        `
    } catch (error){
        res.status(500).json;
    }

});

module.exports = router;