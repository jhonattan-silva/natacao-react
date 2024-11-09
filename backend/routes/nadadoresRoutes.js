const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.get('/listarNadadores', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM nadadores;`);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).send('Erro ao buscar usuários');
    }
});

router.get('/listarEquipes', async (req, res) => {
    try {
      const [equipes] = await db.query('SELECT id, nome FROM equipes');
      res.json(equipes);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      res.status(500).send('Erro ao buscar equipes');
    }
  });

  //Rota para adicionar Nadador
router.post('/cadastrarNadador', async (req, res) => {
    const { nome, cpf, data_nasc, telefone, sexo, equipeId } = req.body;

    const cpfNumeros = cpf.replace(/\D/g, '');
    const telefoneNumeros = telefone.replace(/\D/g, '');

    try {
        // Insere um novo registro no banco de dados
        const [result] = await db.query('INSERT INTO nadadores (nome, cpf, data_nasc, telefone, sexo, equipes_id) VALUES (?, ?, ?, ?, ?, ?)', [nome, cpfNumeros, data_nasc, telefoneNumeros, sexo, equipeId]);
        res.status(201).json({ id: result.insertId }); // Retorna o ID do novo nadador
    } catch (error) {
        console.error('Erro ao adicionar nadador:', error);
        res.status(500).send('Erro ao adicionar nadador');
    }
});



module.exports = router;