const express = require('express');
const db = require('../config/db');

const router = express.Router();

// POST - Criar novo contato (Faca Parte)
router.post('/faca-parte', async (req, res) => {
    try {
        const { nome, clube, cidade, telefone, mensagem } = req.body;

        // Validações básicas
        if (!nome || !clube || !cidade || !telefone || !mensagem) {
            return res.status(400).json({ 
                erro: 'Todos os campos são obrigatórios!' 
            });
        }

        const query = `
            INSERT INTO contatos_faca_parte (nome, clube, cidade, telefone, mensagem)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(query, [nome, clube, cidade, telefone, mensagem], (error, result) => {
            if (error) {
                console.error('Erro ao salvar contato:', error);
                return res.status(500).json({ erro: 'Erro ao processar solicitação' });
            }
            
            res.status(201).json({ 
                mensagem: 'Contato recebido com sucesso! Entraremos em contato em breve.',
                id: result.insertId
            });
        });

    } catch (error) {
        console.error('Erro ao salvar contato:', error);
        res.status(500).json({ 
            erro: 'Erro ao processar solicitação' 
        });
    }
});

// GET - Listar todos os contatos (admin)
router.get('/faca-parte/listar', async (req, res) => {
    try {
        const query = `
            SELECT * FROM contatos_faca_parte 
            ORDER BY data_criacao DESC
        `;

        const contatos = await new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });

        res.status(200).json(contatos);

    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).json({ 
            erro: 'Erro ao buscar contatos' 
        });
    }
});

// PATCH - Atualizar status do contato (admin)
router.patch('/faca-parte/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['novo', 'em_andamento', 'respondido'].includes(status)) {
            return res.status(400).json({ 
                erro: 'Status inválido' 
            });
        }

        const query = `
            UPDATE contatos_faca_parte 
            SET status = ? 
            WHERE id = ?
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [status, id], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        res.status(200).json({ 
            mensagem: 'Status atualizado com sucesso' 
        });

    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        res.status(500).json({ 
            erro: 'Erro ao atualizar contato' 
        });
    }
});

// DELETE - Deletar contato (admin)
router.delete('/faca-parte/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM contatos_faca_parte 
            WHERE id = ?
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [id], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        res.status(200).json({ 
            mensagem: 'Contato deletado com sucesso' 
        });

    } catch (error) {
        console.error('Erro ao deletar contato:', error);
        res.status(500).json({ 
            erro: 'Erro ao deletar contato' 
        });
    }
});

module.exports = router;
