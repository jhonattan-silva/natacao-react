const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware'); // Autenticação



router.get('/listarNadadores', authMiddleware, async (req, res) => {
    try {
        const equipeId = req.user.equipeId; // Obtém o equipeId do usuário logado a partir do token JWT

        if (!equipeId) {
            return res.status(400).json({ message: 'Usuário não pertence a nenhuma equipe.' });
        }

        // Busca os nadadores que pertencem à equipe do usuário logado
        const [rows] = await db.query('SELECT nome, cpf, data_nasc, celular, sexo FROM nadadores WHERE equipes_id = ?', [equipeId]);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar nadadores:', error);
        res.status(500).send('Erro ao buscar nadadores');
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