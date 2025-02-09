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
            JOIN torneios ON eventos.torneios_id = torneios.id
        `);

        res.json(etapas);
    } catch (error) {
        console.error('Erro ao buscar etapas:', error);
        res.status(500).json({ error: 'Erro ao buscar etapas' });
    }
});


router.get('/listarEtapasAnoAtual', async (req, res) => {
    try {
        const [etapasAno] = await db.query(`
            SELECT * 
            FROM eventos 
            WHERE YEAR(data) = YEAR(CURDATE())
        `);

        res.json(etapasAno);
    } catch (error) {
        console.error('Erro ao buscar etapas do ano:', error);
        res.status(500).json({ error: 'Erro ao buscar etapas do ano' });
    }
});

// Rota para BUSCAR ETAPAS POR ANO
router.get('/listarEtapasAno/:ano', async (req, res) => {
    const ano = req.params.ano; // Obtém o parâmetro 'ano' da URL
    try {
        const [etapasAno] = await db.query(`
            SELECT * 
            FROM eventos 
            WHERE YEAR(data) = ?
        `, [ano]);

        res.json(etapasAno);
    } catch (error) {
        console.error('Erro ao buscar etapas do ano:', error);
        res.status(500).json({ error: 'Erro ao buscar etapas do ano' });
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
    const { nome, data, cidade, sede, endereco, quantidade_raias, torneios_id, provas } = req.body;

    try {
        console.log('Dados recebidos para cadastro:', req.body); // Adiciona log para depuração

        // Cria o evento na tabela etapas
        const [result] = await db.query(
            'INSERT INTO eventos (nome, data, cidade, sede, endereco, quantidade_raias, torneios_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nome, data, cidade, sede, endereco, quantidade_raias, torneios_id]
        );
        const etapaId = result.insertId; // ID do novo evento (etapa) criado

        // Insere as provas na tabela eventos_provas
        for (const prova of provas) {
            console.log('Inserindo prova COMPLETA:', prova); // Adiciona log para depuração
            
            await db.query(
                'INSERT INTO eventos_provas (eventos_id, provas_id) VALUES (?, ?)',
                [etapaId, prova.id]
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
            quantidade_raias: etapa[0].quantidade_raias,
            torneios_id: etapa[0].torneios_id,
            provas: provasCadastradas.map(prova => prova.provas_id) // Retorna apenas uma lista de IDs das provas
        });
    } catch (error) {
        console.error('Erro ao cadastrar etapa:', error);
        res.status(500).json({ error: 'Erro ao cadastrar etapa' });
        return; // Adicionado para evitar execução adicional após erro
    }
});

// Rota para SALVAR ATUALIZAÇÕES uma etapa e suas provas
router.put('/atualizarEtapas/:id', async (req, res) => {
    const etapaId = req.params.id;
    const { nome, data, cidade, sede, endereco, quantidade_raias, torneios_id, provas } = req.body;

    try {
        console.log('Dados recebidos para atualização:', req.body); // Adiciona log para depuração

        // Atualiza os dados básicos da etapa
        await db.query(
            'UPDATE eventos SET nome = ?, data = ?, cidade = ?, sede = ?, endereco = ?, quantidade_raias = ?, torneios_id = ? WHERE id = ?',
            [nome, data, cidade, sede, endereco, quantidade_raias, torneios_id, etapaId] // Define quantidade_raias como '6' se estiver vazio
        );

        // Remove as associações antigas de provas para a etapa
        const [eventosProvas] = await db.query('SELECT id FROM eventos_provas WHERE eventos_id = ?', [etapaId]);
        const eventosProvasIds = eventosProvas.map(ep => ep.id);

        if (eventosProvasIds.length > 0) {
            await db.query('DELETE FROM inscricoes WHERE eventos_provas_id IN (?)', [eventosProvasIds]);
            await db.query('DELETE FROM eventos_provas WHERE eventos_id = ?', [etapaId]);
        }

        // Insere as novas associações de provas com a ordem correta
        for (const prova of provas) {
            await db.query(
                'INSERT INTO eventos_provas (eventos_id, provas_id, ordem) VALUES (?, ?, ?)',
                [etapaId, prova.id, prova.ordem]
            );
        }

        res.json({ message: 'Etapa atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar etapa:', error);
        res.status(500).json({ error: 'Erro ao atualizar etapa' });
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
             JOIN torneios ON eventos.torneios_id = torneios.id 
             WHERE eventos.id = ?`,
            [etapaId]
        );

        // Verifica se a etapa existe
        if (etapa.length === 0) {
            return res.status(404).json({ error: 'Etapa não encontrada' });
        }

        // Busca os IDs das provas vinculadas à etapa na ordem correta
        const [provasVinculadas] = await db.query(
            `SELECT 
                ep.provas_id AS id,
                ep.ordem,
                p.estilo,
                p.distancia,
                p.tipo,
                p.sexo
             FROM eventos_provas ep
             JOIN provas p ON ep.provas_id = p.id
             WHERE ep.eventos_id = ?
             ORDER BY ep.ordem`,
            [etapaId]
        );

        // Retorna a etapa e as provas vinculadas com a ordem
        res.json({ ...etapa[0], provas: provasVinculadas });
    } catch (error) {
        console.error('Erro ao buscar etapa:', error);
        res.status(500).json({ error: 'Erro ao buscar etapa' });
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

// Rota para ABRIR/FECHAR INSCRIÇÃO
router.put('/abreInscricao/:id', async (req, res) => {
    const etapaId = req.params.id;
    const { inscricao_aberta } = req.body;

    try {
        // Atualiza a coluna inscricao_aberta da etapa
        await db.query(
            'UPDATE eventos SET inscricao_aberta = ? WHERE id = ?',
            [inscricao_aberta, etapaId]
        );

        res.json({ message: 'Inscrição atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar inscrição:', error);
        res.status(500).json({ error: 'Erro ao atualizar inscrição' });
    }
});

module.exports = router;