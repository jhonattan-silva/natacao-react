const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db'); // Configuração do banco de dados
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Registrar usuário
router.post(
    '/register',
    [
        body('nome').notEmpty().withMessage('Nome é obrigatório'),
        body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    ],
    async (req, res) => {
        const { nome, cpf, senha } = req.body;
        const erros = validationResult(req);

        if (!erros.isEmpty()) {
            return res.status(400).json({ errors: erros.array() });
        }

        try {
            const hashedPassword = await bcrypt.hash(senha, 10);
            await db.query(
                'INSERT INTO usuarios (nome, cpf, senha, role) VALUES (?, ?, ?, ?)',
                [nome, cpf, hashedPassword, 'user'] // Define role padrão como 'user'
            );
            res.status(201).json({ message: 'Usuário registrado com sucesso!' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao registrar o usuário.' });
        }
    }
);

// Login
router.post('/login', async (req, res) => {
    const { cpf, senha } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf]);
        const usuario = rows[0];

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            return res.status(401).json({ message: 'CPF ou senha inválidos.' });
        }

        const token = jwt.sign({ id: usuario.id, role: usuario.role }, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

// Verificar informações do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nome, cpf, role FROM usuarios WHERE id = ?', [req.user.id]);
        const usuario = rows[0];

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json(usuario);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar informações do usuário.' });
    }
});

module.exports = router;
