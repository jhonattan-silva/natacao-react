const express = require('express');
const router = express.Router();
const db = require('../config/db');
const pontuacoesRoutes = require('./pontuacoesRoutes'); // Importa as rotas de pontuação
const { classificarProva } = require('./resultadosRoutes'); // Importa a função classificarProva
const rankingsRoutes = require('./rankingsRoutes'); // Importe o router/função
const { atualizarRankingEquipesPorEvento } = require('./rankingsRoutes'); // Importa a função atualizarRankingEquipesPorEvento

/*
**
** listarEventos: Listar todos os eventos
** listarProvasEvento: Listar as provas de um evento específico
** listarBateriasProva: Listar as baterias de uma prova específica
** salvarResultados: Salvar resultados de nadadores e equipes
** transmitirResultadoProva: Transmitir dados completos de uma prova para a tabela resultadosCompletos
** migrarTodosResultados: Migrar todos os resultados antigos para resultadosCompletos
**  
*/


// Função auxiliar para converter "mm:ss:cc" em objeto { minutos, segundos, centesimos }
function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return { minutos: 0, segundos: 0, centesimos: 0 };
    const parts = timeStr.split(':');
    if (parts.length < 3) return { minutos: 0, segundos: 0, centesimos: 0 };
    return {
        minutos: parseInt(parts[0], 10),
        segundos: parseInt(parts[1], 10),
        centesimos: parseInt(parts[2], 10)
    };
}

// Listar todos os eventos
router.get('/listarEventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos where torneios_id = 3');
        res.json(rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos ==> ', erro);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar eventos',
            details: erro.message, // Adiciona detalhes do erro para debug
        });
    }
})

// Listar as provas de um evento específico
router.get('/listarProvasEvento/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        const query = `
            SELECT DISTINCT
                ep.id AS eventos_provas_id,
                p.id AS prova_id,
                CONCAT(ep.ordem, 'ª PROVA - ', p.distancia, ' METROS ', p.estilo, ' ', 
                CASE 
                  WHEN p.sexo = 'F' THEN 'FEMININO'
                  WHEN p.sexo = 'M' THEN 'MASCULINO'
                  ELSE p.sexo
                END) AS nome_prova,
                p.estilo AS prova_estilo,
                p.distancia,
                p.sexo,
                ep.ordem
            FROM 
                eventos_provas ep
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                ep.eventos_id = ?
            ORDER BY ep.ordem ASC;
        `;
        const [rows] = await db.query(query, [eventoId]);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar provas do evento:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar as provas.' });
    }
});

//listar as baterias de uma prova específica
router.get('/listarBateriasProva/:provaId', async (req, res) => {
    const { provaId } = req.params;
    const { eventoId } = req.query; // Recebe o eventoId via query

    if (!provaId || !eventoId) {
        return res.status(400).json({
            success: false,
            message: 'Prova ID e Evento ID são obrigatórios.',
        });
    }

    try {
        // Obter o eventos_provas_id filtrando por provaId e eventoId
        const [evRows] = await db.query(
            "SELECT id as eventosProvasId FROM eventos_provas WHERE provas_id = ? AND eventos_id = ?",
            [provaId, eventoId]
        );
        if (evRows.length === 0) {
            throw new Error("Eventos_Provas não encontrado para provaId " + provaId + " e eventoId " + eventoId);
        }
        const eventosProvasId = evRows[0].eventosProvasId;

        // Obter se a prova é revezamento
        const [provaRows] = await db.query(
            'SELECT eh_revezamento FROM provas WHERE id = ?',
            [provaId]
        );
        const ehRevezamento = provaRows.length > 0 ? Boolean(provaRows[0].eh_revezamento) : false;

        let baterias;
        if (!ehRevezamento) {
            // Consulta as baterias e os nadadores associados à prova
            [baterias] = await db.query(
                `
                SELECT
                    b.id AS bateriaId,
                    b.descricao AS numeroBateria,
                    bi.raia,
                    n.id AS nadadorId,
                    n.nome AS nomeNadador,
                    n.equipes_id AS equipeId,  
                    eq.nome AS nomeEquipe
                FROM baterias b
                INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
                LEFT JOIN nadadores n ON i.nadadores_id = n.id
                LEFT JOIN equipes eq ON n.equipes_id = eq.id 
                WHERE b.eventos_provas_id = ?
                ORDER BY b.id, bi.raia;
                `,
                [eventosProvasId] // Passa o eventos_provas_id como parâmetro
            );
        } else {
            // Consulta as baterias e os revezamentos associados à prova
            [baterias] = await db.query(
                `
                SELECT
                    b.id AS bateriaId,
                    b.descricao AS numeroBateria,
                    bi.raia,
                    ri.equipes_id AS equipeId,
                    eq.nome AS nomeEquipe
                FROM baterias b
                INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
                LEFT JOIN equipes eq ON ri.equipes_id = eq.id
                WHERE b.eventos_provas_id = ?
                ORDER BY b.id, bi.raia;
                `,
                [eventosProvasId] // Passa o eventos_provas_id como parâmetro
            );
        }

        // Verifica se existem resultados para os nadadores usando eventosProvasId
        for (const row of baterias) {
            if (!ehRevezamento) {
                // Atualiza a query para selecionar os novos campos
                const [resultados] = await db.query(
                    'SELECT minutos, segundos, centesimos, status FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ?',
                    [row.nadadorId, eventosProvasId]
                );
                if (resultados.length > 0) {
                    const { minutos, segundos, centesimos, status } = resultados[0];
                    // Formata os campos para "mm:ss:cc"
                    row.tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
                    row.status = status;
                } else {
                    row.tempo = null;
                    row.status = null;
                }
            } else {
                // Atualiza a query para selecionar os novos campos
                const [resultados] = await db.query(
                    'SELECT minutos, segundos, centesimos, status FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ?',
                    [row.equipeId, eventosProvasId]
                );
                if (resultados.length > 0) {
                    const { minutos, segundos, centesimos, status } = resultados[0];
                    // Formata os campos para "mm:ss:cc"
                    row.tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
                    row.status = status;
                } else {
                    row.tempo = null;
                    row.status = null;
                }
            }
        }

        // Organiza os dados por Séries
        const bateriasOrganizadas = baterias.reduce((acc, row) => {
            const { bateriaId, numeroBateria, raia, nadadorId, nomeNadador, tempo, status, equipeId, nomeEquipe } = row;

            let bateria = acc.find((b) => b.bateriaId === bateriaId);
            if (!bateria) {
                bateria = {
                    bateriaId,
                    numeroBateria,
                    nadadores: [],
                    equipes: []
                };
                acc.push(bateria);
            }

            if (!ehRevezamento && nadadorId) {
                bateria.nadadores.push({
                    id: nadadorId,
                    nome: nomeNadador,
                    raia,
                    tempo,
                    status,
                    equipeId // Adiciona equipeId ao objeto nadador
                });
            }

            if (ehRevezamento && equipeId) {
                bateria.equipes.push({
                    id: equipeId,
                    nome: nomeEquipe,
                    raia,
                    tempo,
                    status,
                });
            }

            return acc;
        }, []);

        res.status(200).json(bateriasOrganizadas);
    } catch (error) {
        console.error('Erro ao listar Séries da prova:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar Séries da prova.',
        });
    }
});


// Salvar resultados de nadadores e equipes
router.post('/salvarResultados', async (req, res) => {
    const { provaId, etapaId, dados } = req.body;
    console.log("Entrou no endpoint /salvarResultados");

    if (!provaId || !dados || !Array.isArray(dados)) {
        console.error("Erro: Prova ID ou dados inválidos.");
        return res.status(400).json({
            success: false,
            message: 'Prova ID e dados das Séries são obrigatórios.',
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        console.log(`Buscando se a prova ${provaId} é revezamento...`);
        const [provaRows] = await connection.query(
            `SELECT p.eh_revezamento 
             FROM eventos_provas ep
             JOIN provas p ON ep.provas_id = p.id
             WHERE ep.id = ?`,
            [provaId]
        );

        if (provaRows.length === 0) {
            console.error(`Erro: Evento_Prova com ID ${provaId} não encontrado.`);
            throw new Error('Evento_Prova não encontrado.');
        }

        const ehRevezamento = Boolean(provaRows[0].eh_revezamento);
        console.log(`Prova ${provaId} é revezamento: ${ehRevezamento}`);

        for (const bateria of dados) {
            const { nadadores, equipes } = bateria;

            if ((!nadadores || nadadores.length === 0) && (!equipes || equipes.length === 0)) {
                console.error("Erro: Dados de nadadores ou equipes ausentes ou vazios.");
                throw new Error('Dados de nadadores ou equipes estão ausentes ou vazios.');
            }

            if (nadadores) {
                console.log(`Processando nadadores da bateria...`);
                for (const nadador of nadadores) {
                    const { id: nadadorId, tempo, status, equipeId } = nadador;

                    if (!nadadorId || tempo === undefined || !equipeId) {
                        console.error('Erro: ID do nadador, equipe e tempo são obrigatórios.');
                        throw new Error('ID do nadador, equipe e tempo são obrigatórios.');
                    }

                    const parsedTime = parseTime(tempo);
                    const [existingRows] = await connection.query(
                        'SELECT id FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ? LIMIT 1',
                        [nadadorId, provaId]
                    );

                    if (existingRows.length > 0) {
                        await connection.query(
                            'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ?, equipes_id = ? WHERE id = ?',
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, equipeId, existingRows[0].id]
                        );
                    } else {
                        await connection.query(
                            `INSERT INTO resultados (minutos, segundos, centesimos, nadadores_id, eventos_provas_id, status, equipes_id)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, nadadorId, provaId, status, equipeId]
                        );
                    }
                }
            }

            if (ehRevezamento) {
                console.log("Processando resultados de revezamento...");
                for (const equipe of equipes) {
                    const { id: equipeId, tempo, status } = equipe;

                    if (!equipeId || tempo === undefined) {
                        console.error('Erro: ID da equipe e tempo são obrigatórios.');
                        throw new Error('ID da equipe e tempo são obrigatórios.');
                    }

                    const parsedTime = parseTime(tempo);
                    console.log(`Equipe ID: ${equipeId}, Tempo: ${tempo}, Status: ${status}`);

                    try {
                        const [existingRows] = await connection.query(
                            'SELECT id FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ? LIMIT 1',
                            [equipeId, provaId]
                        );

                        if (existingRows.length > 0) {
                            console.log(`Atualizando resultado existente para equipe ID: ${equipeId}`);
                            const [updateResult] = await connection.query(
                                'UPDATE resultados SET minutos = ?, segundos = ?, centesimos = ?, status = ? WHERE id = ?',
                                [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, status, existingRows[0].id]
                            );
                            console.log(`Linhas afetadas na atualização: ${updateResult.affectedRows}`);
                        } else {
                            console.log(`Inserindo novo resultado para equipe ID: ${equipeId}`);
                            const [insertResult] = await connection.query(
                                `INSERT INTO resultados (minutos, segundos, centesimos, equipes_id, eventos_provas_id, status)
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [parsedTime.minutos, parsedTime.segundos, parsedTime.centesimos, equipeId, provaId, status]
                            );
                            console.log(`Linhas afetadas na inserção: ${insertResult.affectedRows}`);
                        }
                    } catch (dbError) {
                        console.error(`Erro ao processar equipe ID: ${equipeId}`, dbError.message);
                        throw dbError;
                    }
                }
            }
        }

        const [rows] = await connection.query( // Verifica se o evento já teve resultados
            'SELECT COALESCE(?, eventos_id) as eventoId FROM eventos_provas WHERE id = ?',
            [etapaId, provaId]
        );
        if (rows.length > 0) {
            await connection.query(
                'UPDATE eventos SET teve_resultados = 1 WHERE id = ?',
                [rows[0].eventoId]
            );
        }

        // Após salvar os resultados e commit
        await connection.commit();
        connection.release();

        // Chama a rota de classificação da prova
        await classificarProva(provaId);

        // (Opcional) Chama a função de pontuação, se quiser pontuar logo após classificar
        const resultadoPontuacao = await pontuacoesRoutes.calcularPontuacaoEvento(rows[0].eventoId);
        if (resultadoPontuacao.error) {
            throw new Error(resultadoPontuacao.error);
        }

        // Atualiza o ranking das equipes
        await rankingsRoutes.atualizarRankingEquipesPorEvento(rows[0].eventoId);
        await atualizarRankingEquipesPorEvento(rows[0].eventoId);

        res.status(200).json({ success: true, message: 'Resultados, classificação e pontuação salvos com sucesso!' });
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar resultados:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Transmitir dados completos de uma prova para a tabela resultadosCompletos, substituindo as querys de exibição antigas
router.post('/transmitirResultadoProva/:provaId', async (req, res) => {
    const { provaId } = req.params;
    try {
        // Descobre se é revezamento
        const [[provaInfo]] = await db.query(
            'SELECT p.eh_revezamento FROM eventos_provas ep JOIN provas p ON ep.provas_id = p.id WHERE ep.id = ?',
            [provaId]
        );

        let dados = [];
        if (provaInfo.eh_revezamento) {
            // SELECT para revezamento
            [dados] = await db.query(`
                SELECT
                    ep.eventos_id,
                    ep.id AS eventos_provas_id,
                    p.id AS prova_id,
                    CONCAT(ep.ordem, 'ª PROVA - ', p.distancia, ' METROS ', p.estilo, ' ', 
                        CASE 
                          WHEN p.sexo = 'F' THEN 'FEMININO'
                          WHEN p.sexo = 'M' THEN 'MASCULINO'
                          ELSE p.sexo
                        END) AS nome_prova,
                    ep.ordem,
                    p.eh_revezamento,
                    p.sexo AS sexo_prova,
                    b.id AS bateria_id,
                    b.descricao AS numero_bateria,
                    bi.raia,
                    NULL AS nadadores_id,
                    NULL AS nome_nadador,
                    NULL AS categoria_nadador,
                    NULL AS sexo_nadador,
                    ri.equipes_id,
                    eq.nome AS nome_equipe,
                    r.minutos,
                    r.segundos,
                    r.centesimos,
                    r.status
                FROM eventos_provas ep
                JOIN provas p ON ep.provas_id = p.id
                JOIN baterias b ON b.eventos_provas_id = ep.id
                JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
                LEFT JOIN equipes eq ON ri.equipes_id = eq.id
                LEFT JOIN resultados r ON r.equipes_id = ri.equipes_id AND r.eventos_provas_id = ep.id
                WHERE ep.id = ?
            `, [provaId]);
        } else {
            // SELECT para individual (como já faz)
            [dados] = await db.query(`
                SELECT
                    ep.eventos_id,
                    ep.id AS eventos_provas_id,
                    p.id AS prova_id,
                    CONCAT(ep.ordem, 'ª PROVA - ', p.distancia, ' METROS ', p.estilo, ' ', 
                    CASE 
                      WHEN p.sexo = 'F' THEN 'FEMININO'
                      WHEN p.sexo = 'M' THEN 'MASCULINO'
                      ELSE p.sexo
                    END) AS nome_prova,
                    ep.ordem,
                    p.eh_revezamento,
                    p.sexo AS sexo_prova,
                    b.id AS bateria_id,
                    b.descricao AS numero_bateria,
                    bi.raia,
                    n.id AS nadadores_id,
                    n.nome AS nome_nadador,
                    c.nome AS categoria_nadador,
                    n.sexo AS sexo_nadador,
                    eq.id AS equipes_id,
                    eq.nome AS nome_equipe,
                    r.minutos,
                    r.segundos,
                    r.centesimos,
                    r.status
                FROM eventos_provas ep
                JOIN provas p ON ep.provas_id = p.id
                JOIN baterias b ON b.eventos_provas_id = ep.id
                JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
                LEFT JOIN nadadores n ON i.nadadores_id = n.id
                LEFT JOIN categorias c ON n.categorias_id = c.id
                LEFT JOIN equipes eq ON n.equipes_id = eq.id
                LEFT JOIN resultados r ON r.nadadores_id = n.id AND r.eventos_provas_id = ep.id
                WHERE ep.id = ?
            `, [provaId]);
        }

        // Limpa registros antigos dessa prova
        await db.query('DELETE FROM resultadosCompletos WHERE eventos_provas_id = ?', [provaId]);

        // Monta os dados para inserir
        const valores = dados.map(row => [
            row.eventos_id,
            row.eventos_provas_id,
            row.prova_id,
            row.nome_prova,
            row.ordem,
            row.eh_revezamento,
            row.sexo_prova,
            row.bateria_id,
            row.numero_bateria,
            row.raia,
            row.nadadores_id,
            row.nome_nadador,
            row.categoria_nadador,
            row.sexo_nadador,
            row.equipes_id,
            row.nome_equipe,
            row.minutos !== null && row.segundos !== null && row.centesimos !== null
                ? `${String(row.minutos).padStart(2, '0')}:${String(row.segundos).padStart(2, '0')}:${String(row.centesimos).padStart(2, '0')}`
                : null,
            row.minutos,
            row.segundos,
            row.centesimos,
            row.status,
            null, // classificacao
            null, // tipo
            null, // pontuacao_individual
            null  // pontuacao_equipe
        ]);

        if (valores.length > 0) {
            await db.query(`
                INSERT INTO resultadosCompletos (
                    eventos_id, eventos_provas_id, prova_id, nome_prova, ordem, eh_revezamento, sexo_prova,
                    bateria_id, numero_bateria, raia, nadadores_id, nome_nadador, categoria_nadador, sexo_nadador,
                    equipes_id, nome_equipe, tempo, minutos, segundos, centesimos, status, classificacao, tipo,
                    pontuacao_individual, pontuacao_equipe
                ) VALUES ?
            `, [valores]);
        }

        res.json({ success: true, message: 'Transmissão da prova concluída!' });
    } catch (error) {
        console.error('Erro ao transmitir prova:', error.message);
        res.status(500).json({ error: 'Erro ao transmitir prova' });
    }
});

// Migrar todos os resultados antigos para resultadosCompletos
router.post('/migrarTodosResultados', async (req, res) => {
    try {
        // Busca todos os eventos
        const [eventos] = await db.query('SELECT id FROM eventos');
        let totalProvas = 0;
        let totalMigradas = 0;

        for (const evento of eventos) {
            // Busca todas as provas do evento
            const [provas] = await db.query('SELECT id FROM eventos_provas WHERE eventos_id = ?', [evento.id]);
            totalProvas += provas.length;

            for (const prova of provas) {
                // Descobre se é revezamento
                const [[provaInfo]] = await db.query(
                    'SELECT p.eh_revezamento FROM eventos_provas ep JOIN provas p ON ep.provas_id = p.id WHERE ep.id = ?',
                    [prova.id]
                );

                let dados = [];
                if (provaInfo.eh_revezamento) {
                    [dados] = await db.query(`
                        SELECT
                            ep.eventos_id,
                            ep.id AS eventos_provas_id,
                            p.id AS prova_id,
                            CONCAT(ep.ordem, 'ª PROVA - ', p.distancia, ' METROS ', p.estilo, ' ', 
                                CASE 
                                  WHEN p.sexo = 'F' THEN 'FEMININO'
                                  WHEN p.sexo = 'M' THEN 'MASCULINO'
                                  ELSE p.sexo
                                END) AS nome_prova,
                            ep.ordem,
                            p.eh_revezamento,
                            p.sexo AS sexo_prova,
                            b.id AS bateria_id,
                            b.descricao AS numero_bateria,
                            bi.raia,
                            NULL AS nadadores_id,
                            NULL AS nome_nadador,
                            NULL AS categoria_nadador,
                            NULL AS sexo_nadador,
                            ri.equipes_id,
                            eq.nome AS nome_equipe,
                            r.minutos,
                            r.segundos,
                            r.centesimos,
                            r.status
                        FROM eventos_provas ep
                        JOIN provas p ON ep.provas_id = p.id
                        JOIN baterias b ON b.eventos_provas_id = ep.id
                        JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                        LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
                        LEFT JOIN equipes eq ON ri.equipes_id = eq.id
                        LEFT JOIN resultados r ON r.equipes_id = ri.equipes_id AND r.eventos_provas_id = ep.id
                        WHERE ep.id = ?
                    `, [prova.id]);
                } else {
                    [dados] = await db.query(`
                        SELECT
                            ep.eventos_id,
                            ep.id AS eventos_provas_id,
                            p.id AS prova_id,
                            CONCAT(ep.ordem, 'ª PROVA - ', p.distancia, ' METROS ', p.estilo, ' ', 
                            CASE 
                              WHEN p.sexo = 'F' THEN 'FEMININO'
                              WHEN p.sexo = 'M' THEN 'MASCULINO'
                              ELSE p.sexo
                            END) AS nome_prova,
                            ep.ordem,
                            p.eh_revezamento,
                            p.sexo AS sexo_prova,
                            b.id AS bateria_id,
                            b.descricao AS numero_bateria,
                            bi.raia,
                            n.id AS nadadores_id,
                            n.nome AS nome_nadador,
                            c.nome AS categoria_nadador,
                            n.sexo AS sexo_nadador,
                            eq.id AS equipes_id,
                            eq.nome AS nome_equipe,
                            r.minutos,
                            r.segundos,
                            r.centesimos,
                            r.status
                        FROM eventos_provas ep
                        JOIN provas p ON ep.provas_id = p.id
                        JOIN baterias b ON b.eventos_provas_id = ep.id
                        JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
                        LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
                        LEFT JOIN nadadores n ON i.nadadores_id = n.id
                        LEFT JOIN categorias c ON n.categorias_id = c.id
                        LEFT JOIN equipes eq ON n.equipes_id = eq.id
                        LEFT JOIN resultados r ON r.nadadores_id = n.id AND r.eventos_provas_id = ep.id
                        WHERE ep.id = ?
                    `, [prova.id]);
                }

                // Limpa registros antigos dessa prova
                await db.query('DELETE FROM resultadosCompletos WHERE eventos_provas_id = ?', [prova.id]);

                // Monta os dados para inserir
                const valores = dados.map(row => [
                    row.eventos_id,
                    row.eventos_provas_id,
                    row.prova_id,
                    row.nome_prova,
                    row.ordem,
                    row.eh_revezamento,
                    row.sexo_prova,
                    row.bateria_id,
                    row.numero_bateria,
                    row.raia,
                    row.nadadores_id,
                    row.nome_nadador,
                    row.categoria_nadador,
                    row.sexo_nadador,
                    row.equipes_id,
                    row.nome_equipe,
                    row.minutos !== null && row.segundos !== null && row.centesimos !== null
                        ? `${String(row.minutos).padStart(2, '0')}:${String(row.segundos).padStart(2, '0')}:${String(row.centesimos).padStart(2, '0')}`
                        : null,
                    row.minutos,
                    row.segundos,
                    row.centesimos,
                    row.status,
                    null, // classificacao (pode ser calculada depois)
                    null, // tipo (ABSOLUTO/CATEGORIA, pode ser calculada depois)
                    null, // pontuacao_individual
                    null  // pontuacao_equipe
                ]);

                if (valores.length > 0) {
                    await db.query(`
                        INSERT INTO resultadosCompletos (
                            eventos_id, eventos_provas_id, prova_id, nome_prova, ordem, eh_revezamento, sexo_prova,
                            bateria_id, numero_bateria, raia, nadadores_id, nome_nadador, categoria_nadador, sexo_nadador,
                            equipes_id, nome_equipe, tempo, minutos, segundos, centesimos, status, classificacao, tipo,
                            pontuacao_individual, pontuacao_equipe
                        ) VALUES ?
                    `, [valores]);
                }
                totalMigradas++;
            }
        }

        res.json({ success: true, message: `Migração concluída! Provas migradas: ${totalMigradas}/${totalProvas}` });
    } catch (error) {
        console.error('Erro ao migrar resultados:', error.message);
        res.status(500).json({ error: 'Erro ao migrar resultados.' });
    }
});

module.exports = router;