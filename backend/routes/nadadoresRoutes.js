const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware'); // Autenticação
const { validarData, validarDataNaoFutura, validarCPF, somenteNumeros, validarCelular } = require('../servicos/functions');

router.get('/listarNadadores', authMiddleware, async (req, res) => {
    try {
        const equipeId = req.query.equipeId; // Pega equipeId da query, não do usuário

        let query = `SELECT n.*, c.nome AS categoria_nome
                     FROM nadadores n
                     LEFT JOIN categorias c ON n.categorias_id = c.id`;
        let queryParams = [];

        if (equipeId && !isNaN(equipeId)) {
            query += ' WHERE n.equipes_id = ?';
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

    const cpfNumeros = somenteNumeros(cpf);
    const telefoneNumeros = somenteNumeros(telefone);

    try {
        // Validações
        if (!validarCPF(cpfNumeros)) {
            return res.status(400).json({ message: 'CPF inválido.' });
        }
        if (!validarData(data_nasc) || !validarDataNaoFutura(data_nasc)) {
            return res.status(400).json({ message: 'Data de nascimento inválida ou no futuro.' });
        }
        if (!validarCelular(telefoneNumeros)) {
            return res.status(400).json({ message: 'Telefone inválido. Certifique-se de que o número está correto.' });
        }

        // Verifica se o CPF já está cadastrado
        const [cpfExistente] = await db.query(
            'SELECT id FROM nadadores WHERE cpf = ?',
            [cpfNumeros]
        );
        if (cpfExistente.length > 0) {
            console.error(`Tentativa de cadastro com CPF duplicado: ${cpfNumeros}`);
            return res.status(409).json({ message: 'CPF já cadastrado.' });
        }

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
        res.status(500).json({ message: 'Erro ao adicionar nadador.', details: error.message });
    }
});

// Rota para atualizar Nadador
router.put('/atualizarNadador/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id); // Converte para número
    const { nome, cpf, data_nasc, telefone, sexo, equipeId, cidade } = req.body;

    const cpfNumeros = cpf.replace(/\D/g, '');
    const telefoneNumeros = telefone.replace(/\D/g, '');

    try {
        // Verifica se o CPF já está cadastrado em outro nadador
        const [cpfExistente] = await db.query(
            'SELECT id FROM nadadores WHERE cpf = ? AND id <> ?',
            [cpfNumeros, id]
        );
        if (cpfExistente.length > 0) {
            return res.status(409).json({ message: 'CPF já cadastrado.' });
        }

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

        // Atualiza o nadador no banco de dados com a categoria correspondente
        await db.query(
            `UPDATE nadadores SET nome = ?, cpf = ?, data_nasc = ?, celular = ?, sexo = ?, equipes_id = ?, categorias_id = ?, cidade = ? WHERE id = ?`,
            [nome, cpfNumeros, data_nasc, telefoneNumeros, sexo, equipeId, categoria[0].id, cidade, id]
        );

        res.status(200).send('Nadador atualizado com sucesso.');
    } catch (error) {
        console.error('Erro ao atualizar nadador:', error);
        res.status(500).send('Erro ao atualizar nadador');
    }
});

//rota para inativar ou reativar nadador
router.put('/inativarNadador/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id); // Converte para número
    const { ativo } = req.body;

    console.log("ID do nadador recebido na API:", id);
    console.log("Status do nadador recebido na API:", ativo);

    if (isNaN(id)) {
        return res.status(400).send("ID inválido.");
    }

    try {
        await db.query('UPDATE nadadores SET ativo = ? WHERE id = ?', [ativo, id]);
        res.status(200).send('Status do nadador atualizado com sucesso.');
    } catch (error) {
        console.error('Erro ao alterar status do nadador:', error);
        res.status(500).send('Erro ao alterar status do nadador');
    }
});

// Nova rota para verificar se o CPF já está cadastrado
router.get('/verificarCpf', authMiddleware, async (req, res) => {
    try {
        const { cpf } = req.query;
        if (!cpf) return res.status(400).json({ message: 'CPF não fornecido.' });
        const cpfNumeros = cpf.replace(/\D/g, '');
        
        //Busca também o nome do nadador e da equipe
        const [rows] = await db.query(`
            SELECT n.id, n.nome AS nadador_nome, e.nome AS equipe_nome
            FROM nadadores n
            LEFT JOIN equipes e ON n.equipes_id = e.id
            WHERE n.cpf = ?
        `, [cpfNumeros]);
        
        if (rows.length > 0) {
            // Retorna informações completas
            res.json({ 
                exists: true, 
                nadador: rows[0].nadador_nome,
                equipe: rows[0].equipe_nome || 'Sem equipe' 
            });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Erro ao verificar CPF:', error);
        res.status(500).json({ message: 'Erro ao verificar CPF', error: error.message });
    }
});

module.exports = router;