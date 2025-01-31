const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware'); // Autenticação



router.get('/listarNadadores', authMiddleware, async (req, res) => {
    try {
        const equipeId = req.user.equipeId;

        console.log("Equipe ID:", equipeId); // Debugging

        // Query base
        let query = 'SELECT nome, cpf, data_nasc, celular, sexo, cidade FROM nadadores';
        let queryParams = [];

        // Adiciona filtro apenas se equipeId for válido
        if (equipeId && !isNaN(equipeId)) {
            query += ' WHERE equipes_id = ?';
            queryParams.push(equipeId);
        }

        const [rows] = await db.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar nadadores:', error);
        res.status(500).json({ message: 'Erro ao buscar nadadores', error: error.message });
    }
});


router.get('/listarEquipes', authMiddleware, async (req, res) => {
    try {
        const [equipes] = await db.query('SELECT id, nome FROM equipes');
        res.json(equipes);
    } catch (error) {
        console.error('Erro ao buscar equipes:', error);
        res.status(500).send('Erro ao buscar equipes');
    }
});

//Rota para adicionar Nadador
router.post('/cadastrarNadador', authMiddleware, async (req, res) => {
    const { nome, cpf, data_nasc, telefone, sexo, equipeId, cidade } = req.body;

    const cpfNumeros = cpf.replace(/\D/g, '');
    const telefoneNumeros = telefone.replace(/\D/g, '');

    try {
        // Calcula a idade com base apenas no ano de nascimento
        const anoAtual = new Date().getFullYear();
        const anoNascimento = new Date(data_nasc).getFullYear();
        const idade = anoAtual - anoNascimento;

        // Busca a categoria com base na idade
        const [categoria] = await db.query(
            `SELECT id FROM categorias WHERE sexo = ? AND idade_min <= ? AND (idade_max >= ? OR idade_max IS NULL) LIMIT 1`,
            [sexo, idade, idade]
        );

        if (!categoria.length) {
            return res.status(400).send('Nenhuma categoria encontrada para este nadador.');
        }

        // Insere o nadador no banco de dados com a categoria correspondente
        const [result] = await db.query(
            `INSERT INTO nadadores (nome, cpf, data_nasc, celular, sexo, equipes_id, categorias_id, cidade) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, cpfNumeros, data_nasc, telefoneNumeros, sexo, equipeId, categoria[0].id, cidade]
        );

        res.status(201).json({ id: result.insertId }); // Retorna o ID do novo nadador
    } catch (error) {
        console.error('Erro ao adicionar nadador:', error);
        res.status(500).send('Erro ao adicionar nadador');
    }
});

module.exports = router;