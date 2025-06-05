const express = require('express');
const router = express.Router();
const db = require('../config/db');

/****
 * listarEventosComResultados - Rota para listar eventos com resultados - Eventos que já tiveram resultados digitados
 * resultadosEvento - Rota para listar resultados de um evento específico - Tempos de cada prova, bateria e nadador por evento
 * resultadosPorCategoria - Rota para listar resultados por categoria e prova - Ranking da prova por categoria e sexo
 * resultadosAbsoluto - Rota para listar resultados absolutos (sem categoria) - Ranking geral da prova por sexo
 * fecharClassificacao - Rota para fechar a classificação de um evento - Depois de todos os resultados digitados, gera a classificação final
 * listarDoBanco - Rota para listar resultados do banco de dados - Mostra a classificação final do evento
 * atualizar-recordes - Rota para atualizar recordes individuais e de revezamento - Inclui/Atualiza os recordes de cada nadador/equipe
 */

//Página inicial, sem evento selecionado só para mostrar os eventos que já tiveram resultados digitados
router.get('/listarEventosComResultados', async (req, res) => {
  try {
      const [rows] = await db.query('SELECT * FROM eventos WHERE teve_resultados = true');
      res.json(rows);
  } catch (error) {
      console.error('Erro ao buscar eventos com resultados:', error);
      res.status(500).json({
          success: false,
          message: 'Erro ao buscar eventos com resultados',
          details: error.message,
      });
  }
});


// Rota para listar resultados por categoria e prova
router.get('/resultadosPorCategoria/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        // Buscar resultados completos do evento
        const [resultados] = await db.query(`
            SELECT 
                rc.eventos_provas_id,
                rc.prova_id,
                rc.nome_prova,
                rc.categoria_nadador,
                rc.sexo_nadador,
                rc.nome_nadador,
                rc.equipes_id,
                rc.nome_equipe,
                rc.tempo,
                rc.minutos,
                rc.segundos,
                rc.centesimos,
                rc.status,
                rc.eh_revezamento,
                p.eh_prova_categoria,
                p.sexo AS sexo_prova,
                c.pontuacao_individual,
                c.pontuacao_equipe
            FROM resultadosCompletos rc
            JOIN eventos_provas ep ON rc.eventos_provas_id = ep.id
            JOIN provas p ON ep.provas_id = p.id
            LEFT JOIN classificacoes c ON c.eventos_provas_id = rc.eventos_provas_id AND c.nadadores_id = rc.nadadores_id
            WHERE rc.eventos_id = ?
            ORDER BY rc.eh_revezamento ASC, rc.ordem ASC, rc.categoria_nadador ASC, rc.sexo_nadador ASC, rc.minutos ASC, rc.segundos ASC, rc.centesimos ASC
        `, [eventoId]);

        // Agrupar por prova, categoria e sexo (revezamento separado por sexo)
        const classificacao = {};
        resultados.forEach(row => {
            const provaKey = row.eh_revezamento
                ? `Revezamento - ${row.nome_prova} (${row.sexo_prova})`
                : `${row.nome_prova} - ${row.categoria_nadador} (${row.sexo_nadador})`;

            if (!classificacao[provaKey]) {
                classificacao[provaKey] = [];
            }

            // Formatar tempo ou definir texto personalizado
            if (row.status === 'DQL') {
                row.tempo = 'DQL';
                row.classificacao = 'DQL';
            } else if (row.status === 'NC' || !row.tempo) {
                row.tempo = 'NC';
                row.classificacao = 'NC';
            } else {
                row.classificacao = null; // Definir depois
            }

            classificacao[provaKey].push({
              classificacao: row.classificacao,
              nomeNadador: row.nome_nadador,
              nomeEquipe: row.nome_equipe,
              minutos: row.minutos,
              segundos: row.segundos,
              centesimos: row.centesimos,
              categoria: row.categoria_nadador,
              status: row.status,
              tempo: row.tempo,
              pontuacao_individual: row.pontuacao_individual,
              pontuacao_equipe: row.pontuacao_equipe,
              eh_prova_categoria: row.eh_prova_categoria === 1 
            });
        });

        // Adicionar posição no ranking dentro de cada prova + categoria + sexo
        for (const prova in classificacao) {
            // Separar resultados válidos e inválidos
            const validos = [];
            const invalidos = [];
            classificacao[prova].forEach(row => {
                if (row.classificacao) {
                    invalidos.push(row); // Já possui status (DQL ou NC)
                } else {
                    validos.push(row);
                }
            });

            // Classificar válidos e adicionar posição
            validos.forEach((atleta, index) => {
                atleta.classificacao = index + 1; // 1º, 2º, 3º...
            });

            // Combinar válidos e inválidos
            classificacao[prova] = [...validos, ...invalidos];
        }

        res.json(classificacao);
    } catch (error) {
        console.error('Erro ao buscar resultados por categoria e prova:', error.message);
        res.status(500).json({ error: 'Erro ao buscar resultados por categoria e prova' });
    }
});


// Rota para listar resultados absolutos (sem categoria)
router.get('/resultadosAbsoluto/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        // Buscar resultados com provas, sexo e categoria
        const [resultados] = await db.query(`
          SELECT 
              c.id, 
              c.eventos_provas_id, 
              p.id AS prova_id, 
              CONCAT(p.distancia, ' METROS', ' ', p.estilo) AS prova_nome, 
              c.nadadores_id, 
              n.nome AS nome_nadador, 
              c.equipes_id, 
              e.nome AS nome_equipe, 
              c.tempo, 
              c.classificacao, 
              c.status, 
              c.tipo,
              p.eh_revezamento,
              p.sexo AS sexo_prova,
              n.sexo AS sexo_nadador,
              cat.nome AS categoria_nadador,  
              c.pontuacao_individual, 
              c.pontuacao_equipe,
              ep.ordem  
          FROM classificacoes c
          JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
          JOIN provas p ON ep.provas_id = p.id
          LEFT JOIN nadadores n ON c.nadadores_id = n.id
          LEFT JOIN equipes e ON c.equipes_id = e.id
          LEFT JOIN categorias cat ON n.categorias_id = cat.id  
          WHERE ep.eventos_id = ?
          ORDER BY ep.ordem ASC, c.tipo ASC, c.eventos_provas_id ASC, c.classificacao ASC; 
        `, [eventoId]);

        // Agrupar por prova e sexo (revezamento separado por sexo)
        const classificacao = {};
        resultados.forEach(row => {
            const provaKey = row.eh_revezamento 
                ? `Revezamento - ${row.nomeProva} (${row.sexoProva})` 
                : `${row.nomeProva} (${row.sexoNadador})`;

            if (!classificacao[provaKey]) {
                classificacao[provaKey] = [];
            }

            // Formatar tempo ou definir texto personalizado
            if (row.status === 'DQL') { // Alterado de 'DESC'
                row.tempo = 'DQL';
                row.classificacao = 'DQL';
            } else if (row.status === 'NC' || (row.minutos === 0 && row.segundos === 0 && row.centesimos === 0)) {
                row.tempo = 'NC';
                row.classificacao = 'NC';
            } else {
                row.tempo = `${String(row.minutos).padStart(2, '0')}:${String(row.segundos).padStart(2, '0')}:${String(row.centesimos).padStart(2, '0')}`;
                row.classificacao = null; // Definir depois
            }

            classificacao[provaKey].push(row);
        });

        // Adicionar posição no ranking dentro de cada prova + sexo
        for (const prova in classificacao) {
            // Separar resultados válidos e inválidos
            const validos = [];
            const invalidos = [];
            classificacao[prova].forEach(row => {
                if (row.classificacao) {
                    invalidos.push(row); // Já possui status (DESC ou NC)
                } else {
                    validos.push(row);
                }
            });

            // Classificar válidos e adicionar posição
            validos.forEach((atleta, index) => {
                atleta.classificacao = index + 1; // 1º, 2º, 3º...
            });

            // Combinar válidos e inválidos
            classificacao[prova] = [...validos, ...invalidos];
        }

        res.json(classificacao);
    } catch (error) {
        console.error('Erro ao buscar resultados absolutos:', error.message);
        res.status(500).json({ error: 'Erro ao buscar resultados' });
    }
});


// Rota para fechar a classificação de um evento
router.post('/fecharClassificacao/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [evento] = await connection.query(
      `SELECT classificacao_finalizada FROM eventos WHERE id = ?`, 
      [eventoId]
    );
    if (evento[0].classificacao_finalizada) {
      await connection.release();
      return res.status(400).json({ error: 'Classificação já foi fechada para este evento.' });
    }

    // Excluir classificações anteriores para este evento
    await connection.query(`
      DELETE c FROM classificacoes c
      INNER JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
      WHERE ep.eventos_id = ?
    `, [eventoId]);

    // Buscar os resultados do evento
    const [resultados] = await connection.query(`
      SELECT 
          r.nadadores_id AS nadadorId,
          r.equipes_id AS equipeId,
          r.eventos_provas_id AS eventosProvasId,
          p.eh_revezamento,
          p.eh_prova_ouro,
          r.minutos, r.segundos, r.centesimos,
          r.status
      FROM resultados r
      JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
      JOIN provas p ON ep.provas_id = p.id
      WHERE ep.eventos_id = ?
      ORDER BY p.eh_revezamento ASC, p.id ASC, r.minutos ASC, r.segundos ASC, r.centesimos ASC;
    `, [eventoId]);

    const classificacoes = [];
    const provas = {};

    resultados.forEach(row => {
      const chave = row.eventosProvasId;
      if (!provas[chave]) provas[chave] = [];
      provas[chave].push(row);
    });

    for (const eventosProvasId in provas) {
      let posicao = 1;
      provas[eventosProvasId].forEach(row => {
        const tempo = row.status === 'OK' 
          ? `${String(row.minutos).padStart(2, '0')}:${String(row.segundos).padStart(2, '0')}:${String(row.centesimos).padStart(2, '0')}`
          : row.status === 'DQL' ? 'DQL' : 'NC';
        const classificacao = row.status === 'OK' ? posicao++ : null;
        classificacoes.push([
          row.eventosProvasId,
          row.nadadorId || null,
          row.equipeId || null,
          tempo,
          classificacao,
          row.status,
          row.eh_revezamento || row.eh_prova_ouro ? 'ABSOLUTO' : 'CATEGORIA'
        ]);
      });
    }

    if (classificacoes.length > 0) {
      await connection.query(`
        INSERT INTO classificacoes (eventos_provas_id, nadadores_id, equipes_id, tempo, classificacao, status, tipo)
        VALUES ?
      `, [classificacoes]);

      await connection.query(`UPDATE eventos SET classificacao_finalizada = 1 WHERE id = ?`, [eventoId]);
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Classificação fechada com sucesso!' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Erro ao fechar classificação:', error.message);
    res.status(500).json({ error: 'Erro ao fechar classificação' });
  }
});

// Rota para listar resultados do banco de dados
router.get('/listarDoBanco/:eventoId', async (req, res) => {
  const { eventoId } = req.params;

  try {
    // Buscar resultados do banco
    const [resultados] = await db.query(`
      SELECT 
        c.id, 
        c.eventos_provas_id, 
        p.id AS prova_id, 
        CONCAT(p.distancia, ' METROS', ' ', p.estilo) AS prova_nome, 
        c.nadadores_id, 
        n.nome AS nome_nadador, 
        c.equipes_id, 
        e.nome AS nome_equipe, 
        c.tempo, 
        c.classificacao, 
        c.status, 
        c.tipo,
        p.eh_revezamento,
        p.sexo AS sexo_prova,
        n.sexo AS sexo_nadador,
        cat.nome AS categoria_nadador,  
        c.pontuacao_individual,
        c.pontuacao_equipe,
        ep.ordem
      FROM classificacoes c
      JOIN eventos_provas ep ON c.eventos_provas_id = ep.id
      JOIN provas p ON ep.provas_id = p.id
      LEFT JOIN nadadores n ON c.nadadores_id = n.id
      LEFT JOIN equipes e ON c.equipes_id = e.id
      LEFT JOIN categorias cat ON n.categorias_id = cat.id  
      WHERE ep.eventos_id = ?
      ORDER BY ep.ordem ASC, c.tipo ASC, c.eventos_provas_id ASC, c.classificacao ASC;  
    `, [eventoId]);

    const classificacao = {}; // Objeto para agrupar os resultados
    resultados.forEach(row => { // Para cada resultado
      const provaKey = row.eh_revezamento // Chave para agrupar os resultados, porque revezamento é diferente
        ? `Revezamento - ${row.prova_nome} (${row.sexo_prova})` // Aparece REVEZAMENTO - Nome da prova + sexo
        : `${row.prova_nome} (${row.sexo_nadador})`; // Nome da prova + sexo

      if (!classificacao[provaKey]) { // Se a chave não existe, criar um array vazio
        classificacao[provaKey] = []; // Inicializa o array vazio para a prova 
      }

      classificacao[provaKey].push({ // Adiciona o resultado ao array da prova
        id: row.id,
        eventos_provas_id: row.eventos_provas_id,
        prova_id: row.prova_id,
        prova_nome: row.prova_nome,
        nadadores_id: row.nadadores_id,
        nome_nadador: row.nome_nadador,
        equipes_id: row.equipes_id,
        nome_equipe: row.nome_equipe,
        tempo: row.tempo,
        classificacao: row.classificacao,
        status: row.status,
        tipo: row.tipo,
        eh_revezamento: row.eh_revezamento,
        sexo_prova: row.sexo_prova,
        sexo_nadador: row.sexo_nadador,
        categoria_nadador: row.categoria_nadador,
        pontuacao_individual: row.pontuacao_individual,  
        pontuacao_equipe: row.pontuacao_equipe       
      });
    });

    for (const prova in classificacao) { // Para cada prova 
      classificacao[prova].sort((a, b) => { // Classificar os resultados por classificação e status
        if (a.status === 'DQL' || a.status === 'NC') return 1; // Se a é DESCLASSIFICADO ou NÃO COMPARECEU, a vem depois
        if (b.status === 'DQL' || b.status === 'NC') return -1; // Se b é DESCLASSIFICADO ou NÃO COMPARECEU, a vem antes
        return a.classificacao - b.classificacao; // Classificar por classificação
      });
    }

    // Retornar os resultados agrupados
    res.json(classificacao);
  } catch (error) {
    console.error('Erro ao buscar resultados do banco:', error.message);
    res.status(500).json({ error: 'Erro ao buscar resultados do banco' });
  }
});

// Função para converter tempo para centésimos
const calcularTempoEmCentesimos = (minutos, segundos, centesimos) => {
  return minutos * 6000 + segundos * 100 + centesimos;
};


// Rota para atualizar recordes individuais e de revezamento
router.post('/atualizar-recordes/:torneioId', async (req, res) => {
  try {
      const { torneioId } = req.params;

      // Buscar tempos individuais (excluindo revezamentos)
      const [resultadosIndividuais] = await db.execute(
          `SELECT r.nadadores_id, ep.provas_id, e.torneios_id, r.minutos, r.segundos, r.centesimos, e.id AS eventos_id
           FROM resultados r
           JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
           JOIN eventos e ON ep.eventos_id = e.id
           JOIN provas p ON ep.provas_id = p.id
           WHERE r.status = 'OK' 
           AND e.torneios_id = ? 
           AND p.eh_revezamento = 0`,
          [torneioId]
      );

      for (const resultado of resultadosIndividuais) {
          const tempoNovo = calcularTempoEmCentesimos(resultado.minutos, resultado.segundos, resultado.centesimos);

          // 2️⃣ Verificar recorde atual do nadador na prova
          const [recordAtual] = await db.execute(
              `SELECT minutos, segundos, centesimos 
               FROM records 
               WHERE nadadores_id = ? AND provas_id = ? AND torneios_id = ?`,
              [resultado.nadadores_id, resultado.provas_id, torneioId]
          );

          if (recordAtual.length === 0) {
              // 3️⃣ Inserir novo recorde
              await db.execute(
                  `INSERT INTO records (nadadores_id, provas_id, torneios_id, eventos_id, minutos, segundos, centesimos)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [resultado.nadadores_id, resultado.provas_id, torneioId, resultado.eventos_id, resultado.minutos, resultado.segundos, resultado.centesimos]
              );
          } else {
              // 4️⃣ Atualizar caso o novo tempo seja melhor
              const tempoAtual = calcularTempoEmCentesimos(recordAtual[0].minutos, recordAtual[0].segundos, recordAtual[0].centesimos);

              if (tempoNovo < tempoAtual) {
                  await db.execute(
                      `UPDATE records 
                       SET minutos = ?, segundos = ?, centesimos = ?, eventos_id = ? 
                       WHERE nadadores_id = ? AND provas_id = ? AND torneios_id = ?`,
                      [resultado.minutos, resultado.segundos, resultado.centesimos, resultado.eventos_id, resultado.nadadores_id, resultado.provas_id, torneioId]
                  );
              }
          }
      }

      // 5️⃣ Buscar tempos de revezamento
      const [resultadosRevezamento] = await db.execute(
          `SELECT r.equipes_id, ep.provas_id, e.torneios_id, r.minutos, r.segundos, r.centesimos, e.id AS eventos_id
           FROM resultados r
           JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
           JOIN eventos e ON ep.eventos_id = e.id
           JOIN provas p ON ep.provas_id = p.id
           WHERE r.status = 'OK' 
           AND e.torneios_id = ? 
           AND p.eh_revezamento = 1`,
          [torneioId]
      );

      for (const resultado of resultadosRevezamento) {
          const tempoNovo = calcularTempoEmCentesimos(resultado.minutos, resultado.segundos, resultado.centesimos);

          // 6️⃣ Verificar recorde atual da equipe na prova
          const [recordAtualEquipe] = await db.execute(
              `SELECT minutos, segundos, centesimos 
               FROM recordsEquipes 
               WHERE equipes_id = ? AND provas_id = ? AND torneios_id = ?`,
              [resultado.equipes_id, resultado.provas_id, torneioId]
          );

          if (recordAtualEquipe.length === 0) {
              // 7️⃣ Inserir novo recorde
              await db.execute(
                  `INSERT INTO recordsEquipes (equipes_id, provas_id, torneios_id, eventos_id, minutos, segundos, centesimos)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [resultado.equipes_id, resultado.provas_id, torneioId, resultado.eventos_id, resultado.minutos, resultado.segundos, resultado.centesimos]
              );
          } else {
              // 8️⃣ Atualizar caso o novo tempo seja melhor
              const tempoAtual = calcularTempoEmCentesimos(recordAtualEquipe[0].minutos, recordAtualEquipe[0].segundos, recordAtualEquipe[0].centesimos);

              if (tempoNovo < tempoAtual) {
                  await db.execute(
                      `UPDATE recordsEquipes 
                       SET minutos = ?, segundos = ?, centesimos = ?, eventos_id = ? 
                       WHERE equipes_id = ? AND provas_id = ? AND torneios_id = ?`,
                      [resultado.minutos, resultado.segundos, resultado.centesimos, resultado.eventos_id, resultado.equipes_id, resultado.provas_id, torneioId]
                  );
              }
          }
      }

      res.status(200).json({ success: "Recordes individuais e de revezamento atualizados com sucesso!" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar recordes." });
  }
});

// Rota para buscar resultados completos direto da nova tabela
router.get('/buscaResultadosCompleto/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT * FROM resultadosCompletos WHERE eventos_id = ? ORDER BY ordem ASC, bateria_id ASC, raia ASC`,
      [eventoId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar resultados completos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar resultados completos' });
  }
});

// Rota para buscar status do evento (classificacao_finalizada)
router.get('/statusEvento/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT classificacao_finalizada FROM eventos WHERE id = ?`,
      [eventoId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json({ classificacao_finalizada: rows[0].classificacao_finalizada });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar status do evento' });
  }
});

// Função nomeada para classificar uma prova
async function classificarProva(provaId) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `DELETE FROM classificacoes WHERE eventos_provas_id = ?`,
      [provaId]
    );

    const [resultados] = await connection.query(`
      SELECT 
        r.nadadores_id AS nadadorId,
        r.equipes_id AS equipeId,
        r.eventos_provas_id AS eventosProvasId,
        p.eh_revezamento,
        p.eh_prova_ouro,
        r.minutos, r.segundos, r.centesimos,
        r.status
      FROM resultados r
      JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
      JOIN provas p ON ep.provas_id = p.id
      WHERE r.eventos_provas_id = ?
      ORDER BY p.eh_revezamento ASC, p.id ASC, r.minutos ASC, r.segundos ASC, r.centesimos ASC
    `, [provaId]);

    const classificacoes = [];
    let posicao = 1;
    resultados.forEach(row => {
      const tempo = row.status === 'OK'
        ? `${String(row.minutos).padStart(2, '0')}:${String(row.segundos).padStart(2, '0')}:${String(row.centesimos).padStart(2, '0')}`
        : row.status === 'DQL' ? 'DQL' : 'NC';
      const classificacao = row.status === 'OK' ? posicao++ : null;
      classificacoes.push([
        row.eventosProvasId,
        row.nadadorId || null,
        row.equipeId || null,
        tempo,
        classificacao,
        row.status,
        row.eh_revezamento || row.eh_prova_ouro ? 'ABSOLUTO' : 'CATEGORIA'
      ]);
    });

    if (classificacoes.length > 0) {
      await connection.query(`
        INSERT INTO classificacoes (eventos_provas_id, nadadores_id, equipes_id, tempo, classificacao, status, tipo)
        VALUES ?
      `, [classificacoes]);
    }

    await connection.commit();
    connection.release();

    return { success: true, message: 'Classificação da prova gerada com sucesso!' };
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Erro ao classificar prova:', error.message);
    throw error;
  }
}

// Rota HTTP usa a função nomeada
router.post('/classificarProva/:provaId', async (req, res) => {
  const { provaId } = req.params;
  try {
    const resultado = await classificarProva(provaId);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao classificar prova' });
  }
});

module.exports = {
    router,
    classificarProva, // ou calcularPontuacaoEvento
};