const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para obter filtros (provas e categorias)
router.get('/filtros', async (req, res) => {
    const { ano } = req.query;
    try {
        const [provas] = await db.execute(
            `SELECT DISTINCT p.id, CONCAT(p.distancia, 'm ', p.estilo) AS prova, p.sexo
             FROM records r
             JOIN provas p ON r.provas_id = p.id
             JOIN torneios t ON r.torneios_id = t.id
             WHERE YEAR(t.data_inicio) = ?`,
            [ano]
        );

        const [categorias] = await db.execute(
            `SELECT DISTINCT nome AS categoria
             FROM categorias`
        );

        // Organiza as provas por sexo
        const provasPorSexo = provas.reduce((acc, prova) => {
            if (!acc[prova.sexo]) {
                acc[prova.sexo] = [];
            }
            acc[prova.sexo].push({ id: prova.id, nome: prova.prova });
            return acc;
        }, {});

        res.json({
            provas: provasPorSexo,
            categorias: categorias.map(c => ({ id: c.categoria, nome: c.categoria }))
        });
    } catch (error) {
        console.error('Erro ao buscar filtros:', error);
        res.status(500).json({ error: 'Erro ao buscar filtros.' });
    }
});

// Rota para obter nadadores filtrados
router.get('/', async (req, res) => {
    const { ano, prova, categoria } = req.query;
    try {
        const query = `
            SELECT n.nome AS nome_nadador, 
                   c.nome AS categoria, 
                   e.nome AS equipe, 
                   CONCAT(LPAD(r.minutos, 2, '0'), ':', LPAD(r.segundos, 2, '0'), '.', LPAD(r.centesimos, 2, '0')) AS tempo
            FROM records r
            JOIN nadadores n ON r.Nadadores_id = n.id
            JOIN categorias c ON n.categorias_id = c.id
            JOIN equipes e ON n.equipes_id = e.id
            JOIN torneios t ON r.torneios_id = t.id
            WHERE YEAR(t.data_inicio) = ?
            ${prova ? 'AND r.provas_id = ?' : ''}
            ${categoria && categoria !== '*' ? 'AND c.nome = ?' : ''} 
            ORDER BY r.minutos, r.segundos, r.centesimos ASC
        `;

        const params = [ano].concat(prova ? [prova] : []).concat(categoria && categoria !== '*' ? [categoria] : []);
        const [nadadores] = await db.execute(query, params);

        res.json(nadadores);
    } catch (error) {
        console.error('Erro ao buscar nadadores:', error);
        res.status(500).json({ error: 'Erro ao buscar nadadores.' });
    }
});

module.exports = router;