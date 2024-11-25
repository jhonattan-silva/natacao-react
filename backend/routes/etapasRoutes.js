const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Rota para BUSCAR TODOS EVENTOS
router.get('/listarEtapas', async (req, res) => {
    try {
        // Consulta com JOIN para buscar o nome do torneio
        const [etapas] = await db.query(`
            SELECT eventos.*, torneios.nome AS Torneio
            FROM eventos
            JOIN torneios ON eventos.Torneios_id = torneios.id
        `);

        res.json(etapas);
    } catch (error) {
        console.error('Erro ao buscar etapas:', error);
        res.status(500).json({ error: 'Erro ao buscar etapas' });
    }
});


// Rota para BUSCAR TODOS TORNEIOS
router.get('/listarTorneios', async (req, res) => {
    try {
        const [torneios] = await db.query('SELECT id, nome FROM torneios');
        res.json(torneios);
    } catch (error) {
        console.error('Erro ao buscar torneios:', error);
        res.status(500).json({ error: 'Erro ao buscar torneios' });
    }
});

// Rota para OBTER PROVAS POR SEXO
router.get('/listarProvas', async (req, res) => {
    try {
        const sexo = req.query.sexo; // Obtém o parâmetro 'sexo' da query string
        let query = 'SELECT id, estilo, distancia, tipo FROM provas';

        if (sexo) {
            query += ' WHERE sexo = ?'; // Adiciona a cláusula WHERE se 'sexo' for fornecido
            const [rows] = await db.query(query, [sexo]); // Passa o parâmetro 'sexo' como valor
            res.json(rows);
        } else {
            // Caso não seja fornecido o parâmetro 'sexo', retorna todas as provas
            const [rows] = await db.query(query);
            res.json(rows);
        }
    } catch (error) {
        console.error('Erro ao carregar provas:', error);
        res.status(500).json({ error: 'Erro ao carregar provas' });
    }
});


//Rota para CADASTRAR NOVA ETAPA
router.post('/cadastrarEtapas', async (req, res) => {
    const { nome, data, cidade, sede, endereco, Torneios_id, provas } = req.body;

    try {
        // Cria o evento na tabela etapas
        const [result] = await db.query(
            'INSERT INTO eventos (nome, data, cidade, sede, endereco, Torneios_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, data, cidade, sede, endereco, Torneios_id]
        );
        const etapaId = result.insertId; // ID do novo evento (etapa) criado

        // Insere as provas na tabela eventos_provas
        for (const prova of provas) {
            await db.query(
                'INSERT INTO eventos_provas (eventos_id, provas_id) VALUES (?, ?)',
                [etapaId, prova.provas_id]
            );
        }

        // Busca o evento recém-cadastrado
        const [etapa] = await db.query('SELECT * FROM eventos WHERE id = ?', [etapaId]);

        // Busca apenas os IDs das provas associadas ao evento
        const [provasCadastradas] = await db.query(
            'SELECT provas_id FROM eventos_provas WHERE eventos_id = ?',
            [etapaId]
        );

        // Retorna os dados estruturados
        res.json({
            id: etapa[0].id,
            nome: etapa[0].nome,
            data: etapa[0].data,
            cidade: etapa[0].cidade,
            sede: etapa[0].sede,
            endereco: etapa[0].endereco,
            Torneios_id: etapa[0].Torneios_id,
            provas: provasCadastradas.map(prova => prova.provas_id) // Retorna apenas uma lista de IDs das provas
        });
    } catch (error) {
        console.error('Erro ao cadastrar etapa:', error);
        res.status(500).json({ error: 'Erro ao cadastrar etapa' });
    }
});




// Rota para BUSCAR uma etapa JÁ CADASTRADA
router.get('/atualizarEtapas/:id', async (req, res) => {
    const etapaId = req.params.id;
    try {
        // Busca os dados da etapa pelo ID
        const [etapa] = await db.query(
            `SELECT eventos.*, torneios.nome AS Torneio 
             FROM eventos 
             JOIN torneios ON eventos.Torneios_id = torneios.id 
             WHERE eventos.id = ?`,
            [etapaId]
        );

        // Verifica se a etapa existe
        if (etapa.length === 0) {
            return res.status(404).json({ error: 'Etapa não encontrada' });
        }

        // Busca os IDs das provas vinculadas à etapa
        const [provasVinculadas] = await db.query(
            'SELECT Provas_id FROM eventos_provas WHERE Eventos_id = ?',
            [etapaId]
        );

        // Extrai apenas os IDs das provas
        const provasIds = provasVinculadas.map(prova => prova.Provas_id);

        // Retorna a etapa e as provas vinculadas
        res.json({ ...etapa[0], provas: provasIds });
    } catch (error) {
        console.error('Erro ao buscar etapa:', error);
        res.status(500).json({ error: 'Erro ao buscar etapa' });
    }
});

// Rota para SALVAR ATUALIZAÇÕES uma etapa e suas provas
router.put('/atualizarEtapas/:id', async (req, res) => {
    const etapaId = req.params.id;
    const { nome, data, cidade, sede, endereco, Torneios_id, provas } = req.body;

    try {
        // Atualiza os dados básicos da etapa
        await db.query(
            'UPDATE eventos SET nome = ?, data = ?, cidade = ?, sede = ?, endereco = ?, Torneios_id = ? WHERE id = ?',
            [nome, data, cidade, sede, endereco, Torneios_id, etapaId]
        );

        // Remove as associações antigas de provas para a etapa
        await db.query('DELETE FROM eventos_provas WHERE Eventos_id = ?', [etapaId]);

        // Insere as novas associações de provas
        for (const prova of provas) {
            await db.query('INSERT INTO eventos_provas (Eventos_id, Provas_id) VALUES (?, ?)', [etapaId, prova.provas_id]);
        }

        res.json({ message: 'Etapa atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar etapa:', error);
        res.status(500).json({ error: 'Erro ao atualizar etapa' });
    }
});

// Rota para EXCLUIR uma etapa
router.delete('/excluiEtapa/:id', async (req, res) => {
    const eventoId = req.params.id;

    // Verifica se o eventoId está presente
    if (!eventoId) {
        console.log("EVENTO ID NÃO FORNECIDO:", eventoId);
        return res.status(400).json({ message: 'Evento ID é necessário para realizar exclusão.' });
    }

    try {
        // await para aguardar a conclusão da operação de exclusão
        await db.query('DELETE FROM eventos WHERE id = ?', [eventoId]);

        res.json({ message: 'Evento excluído com sucesso!' }); // mensagem de sucesso
    } catch (error) {
        console.error('Erro ao excluir evento:', error); // Loga o erro no servidor
        res.status(500).json({ message: 'Erro ao excluir evento.' }); // mensagem de erro ao cliente
    }
});




module.exports = router;