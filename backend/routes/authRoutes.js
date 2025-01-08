const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db'); // Configuração do banco de dados
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router(); // Cria um roteador para as rotas de autenticação 
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro'; // Chave secreta para o JWT 

// Login
router.post('/login', async (req, res) => {
    const { cpf, senha } = req.body; // recebe cpf e senha do corpo da requisição

    try {
        // Busca o usuário pelo CPF
        const [rows] = await db.query('SELECT * FROM usuarios WHERE cpf = ?', [cpf]);
        const usuario = rows[0]; // Pega o primeiro usuário retornado

        if (!usuario) { // Verifica se o usuário não existe
            return res.status(401).json({ message: 'CPF inválido.' });
        }

        if (!(await bcrypt.compare(senha, usuario.senha))) { // Verifica se a senha está incorreta
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        const [equipesId] = await db.query(`
            SELECT Equipes_id 
            FROM usuarios_equipes ue
            INNER JOIN usuarios u ON ue.Usuarios_id = u.id
            WHERE u.id = ?
            `,
            [usuario.id] // Busca o equipeId do usuário logado a partir do token JWT
        );

        // Busca os perfis do usuário
        const [perfis] = await db.query(`
            SELECT p.nome 
            FROM perfis p 
            INNER JOIN usuarios_perfis up ON p.id = up.Perfis_id 
            WHERE up.Usuarios_id = ?
            `,
            [usuario.id]
        );

        // Extrai os nomes dos perfis
        const perfilNomes = perfis.map((p) => p.nome);
        const equipesUsuario = equipesId.map((e) => e.Equipes_id); // Corrigir para acessar Equipes_id


        // Gera o token JWT com os perfis incluídos
        const token = jwt.sign( // Gera o token JWT
            {
                id: usuario.id,
                perfis: perfilNomes,
                equipeId: equipesUsuario // Adiciona o equipeId ao payload do token
            },
            JWT_SECRET, // Chave secreta
            { expiresIn: '2h' } // Expira em 2 horas
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});


// Verificar informações do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nome, cpf, role FROM usuarios WHERE id = ?', [req.user.id]); // Busca o usuário pelo ID
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
