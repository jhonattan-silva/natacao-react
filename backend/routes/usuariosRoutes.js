const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/db');
const { validarCPF, somenteNumeros, validarCelular } = require('../servicos/functions');

router.get('/listarUsuarios', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nome, u.cpf, u.celular, u.email, u.ativo,  
             COALESCE(GROUP_CONCAT(DISTINCT p.nome SEPARATOR ', '), '') AS perfis,
             COALESCE(GROUP_CONCAT(DISTINCT e.nome SEPARATOR ', '), '') AS equipes
      FROM usuarios u
      LEFT JOIN usuarios_perfis up ON u.id = up.usuarios_id
      LEFT JOIN perfis p ON up.perfis_id = p.id
      LEFT JOIN usuarios_equipes ue ON u.id = ue.usuarios_id
      LEFT JOIN equipes e ON ue.equipes_id = e.id
      GROUP BY u.id, u.nome, u.cpf, u.celular, u.email, u.ativo
  `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).send('Erro ao buscar usuários');
  }
});


router.post('/cadastrarUsuario', async (req, res) => {
    const { nome, cpf, celular, email, senha, perfis, equipeId, ativo } = req.body;

    const cpfNumeros = somenteNumeros(cpf);
    const celularNumeros = somenteNumeros(celular);

    let connection; // Define a variável `connection` fora do bloco `try`

    try {
        connection = await db.getConnection(); // Obtém a conexão do pool
        await connection.beginTransaction(); // Inicia a transação

        // Validações
        if (!validarCPF(cpfNumeros)) {
            return res.status(400).json({ message: 'CPF inválido.' });
        }
        if (!validarCelular(celularNumeros)) {
            return res.status(400).json({ message: 'Celular inválido. Certifique-se de que o número está correto.' });
        }
        // Verifica se o CPF já está cadastrado
        const [cpfRepetido] = await connection.query('SELECT id FROM usuarios WHERE cpf = ?', [cpfNumeros]);
        if (cpfRepetido.length > 0) {
            return res.status(400).json({ message: 'CPF já registrado' });
        }

        // Verifica se os campos obrigatórios estão preenchidos
        if (!nome || !cpf || !celular || !email || !senha || perfis.length === 0) {
            return res.status(400).send('Todos os campos são obrigatórios');
        }

        // Criptografar a senha antes de armazená-la no banco de dados
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Insere o usuário na tabela `usuarios`
        const [userResult] = await connection.query(
            'INSERT INTO usuarios (nome, cpf, celular, email, senha, ativo) VALUES (?, ?, ?, ?, ?, 1)', //cadastro vira com ativo = 1
            [nome, cpfNumeros, celularNumeros, email, hashedSenha, ativo]
        );

        const userId = userResult.insertId;

        // Insere os perfis associados ao usuário
        const perfilPromises = perfis.map(perfilId => {
            return connection.query('INSERT INTO usuarios_perfis (usuarios_id, perfis_id) VALUES (?, ?)', [userId, perfilId]);
        });

        await Promise.all(perfilPromises); // Executa todas as inserções de perfis em paralelo

        // Insere na tabela `usuarios_equipes` somente se `equipeId` for fornecido
        if (equipeId !== null) {
            await connection.query('INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)', [userId, equipeId]);
        }

        await connection.commit(); // Finaliza a transação
        res.status(201).send('Usuário cadastrado com sucesso');
    } catch (error) {
        if (connection) await connection.rollback(); // Desfaz a transação em caso de erro
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).send('Erro ao cadastrar usuário');
    } finally {
        if (connection) connection.release(); // Libera a conexão
    }
});


router.put('/atualizarUsuario/:id', async (req, res) => {
  const userId = req.params.id; // Obtém o ID do usuário a ser atualizado
  const { nome, cpf, celular, email, senha, perfis, equipeId } = req.body; // Obtém os dados do corpo da requisição

  const connection = await db.getConnection(); // Obtém uma conexão do pool para usar a transação

  const cpfNumeros = somenteNumeros(cpf);
  const celularNumeros = somenteNumeros(celular);

  try {
    await connection.beginTransaction(); // Inicia a transação

    // Atualiza os dados do usuário
    let query = 'UPDATE usuarios SET nome = ?, cpf = ?, celular = ?, email = ?';
    const params = [nome, cpfNumeros, celularNumeros, email];

    // Se uma nova senha for enviada, ela deve ser criptografada e atualizada
    if (senha && senha.trim() !== '') {
      const hashedSenha = await bcrypt.hash(senha, 10);
      query += ', senha = ?';
      params.push(hashedSenha);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await connection.query(query, params); // Executa a atualização do usuário

    // Remove os perfis antigos e insere os novos
    await connection.query('DELETE FROM usuarios_perfis WHERE usuarios_id = ?', [userId]);

    if (perfis && perfis.length > 0) {
      const perfilPromises = perfis.map(perfilId => {
        return connection.query('INSERT INTO usuarios_perfis (usuarios_id, perfis_id) VALUES (?, ?)', [userId, perfilId]);
      });

      await Promise.all(perfilPromises);
    }

    // Verifica se o perfil de treinador foi removido
    const perfilTreinadorId = 2; // ID do perfil de treinador
    if (!perfis.includes(perfilTreinadorId)) {
      // Remove a equipe do usuário se o perfil de treinador foi removido
      await connection.query('DELETE FROM usuarios_equipes WHERE usuarios_id = ?', [userId]);
    } else if (equipeId) {
      // Atualiza a equipe do usuário somente se ela for diferente da atual
      const [equipeExistente] = await connection.query(
        'SELECT equipes_id FROM usuarios_equipes WHERE usuarios_id = ?',
        [userId]
      );

      if (equipeExistente.length === 0 || equipeExistente[0].equipes_id !== equipeId) {
        await connection.query('DELETE FROM usuarios_equipes WHERE usuarios_id = ?', [userId]); // Remove a equipe antiga
        await connection.query('INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES (?, ?)', [userId, equipeId]);
      }
    }

    await connection.commit(); // Finaliza a transação
    res.send('Usuário atualizado com sucesso');
  } catch (error) {
    await connection.rollback(); // Desfaz a transação em caso de erro
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).send('Erro ao atualizar usuário');
  } finally {
    connection.release(); // Libera a conexão
  }
});



router.get('/listarPerfis', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome FROM perfis');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    res.status(500).send('Erro ao buscar perfis');
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

router.get('/buscarUsuario/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const query = `
      SELECT u.id, u.nome, u.cpf, u.celular, u.email, ue.equipes_id AS equipeId
      FROM usuarios u
      LEFT JOIN usuarios_equipes ue ON u.id = ue.usuarios_id
      WHERE u.id = ?
    `;

    const [usuario] = await db.query(query, [userId]);

    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(usuario[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).send('Erro ao buscar usuário');
  }
});

router.get('/buscarUsuario/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const query = `
      SELECT u.id, u.nome, u.cpf, u.celular, u.email,
             COALESCE(GROUP_CONCAT(DISTINCT p.nome SEPARATOR ', '), '') AS perfis,
             COALESCE(GROUP_CONCAT(DISTINCT e.nome SEPARATOR ', '), '') AS equipes
      FROM usuarios u
      LEFT JOIN usuarios_perfis up ON u.id = up.usuarios_id
      LEFT JOIN perfis p ON up.perfis_id = p.id
      LEFT JOIN usuarios_equipes ue ON u.id = ue.usuarios_id
      LEFT JOIN equipes e ON ue.equipes_id = e.id
      WHERE u.id = ?
      GROUP BY u.id, u.nome, u.cpf, u.celular, u.email
    `;

    const [usuario] = await db.query(query, [userId]);

    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = usuario[0];

    res.json({
      nome: user.nome,
      cpf: user.cpf,
      celular: user.celular,
      email: user.email,
      equipeId: user.equipeId,
      perfis: user.perfis.split(', '), // Assumindo que os perfis são separados por vírgula
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).send('Erro ao buscar usuário');
  }
});

router.put('/inativarUsuario/:id', async (req, res) => {
  const userId = req.params.id;
  const { ativo } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Update the status of the user
    await connection.query('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo, userId]);

    await connection.commit();
    res.send(`Usuário ${ativo === 1 ? 'ativado' : 'inativado'} com sucesso`);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar status do usuário:', error);
    res.status(500).send('Erro ao atualizar status do usuário');
  } finally {
    connection.release();
  }
});

module.exports = router;