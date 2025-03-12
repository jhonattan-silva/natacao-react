const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Atualiza a função auxiliar para converter o tempo para segundos com frações
function formatTime(timeStr) {
    const parts = timeStr.split(':');
    const secondsParts = parts[2].split('.');
    
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    let seconds = parseInt(secondsParts[0], 10);
    let centiseconds = parseInt(secondsParts[1] || '00', 10); // Pega os centésimos de segundo

    // Converte tudo para segundos
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds + (centiseconds / 100);
    
    return totalSeconds.toFixed(2); // Retorna o tempo em segundos com duas casas decimais
}

//Página inicial, sem evento selecionado
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

router.get('/resultadosEvento/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    // Query para listar todas as provas do evento
    const queryProvas = `
            SELECT DISTINCT
                ep.id AS eventos_provas_id,
                p.id AS prova_id,
                CONCAT(p.estilo, ' ', p.distancia, 'm ', IF(p.eh_revezamento, 'Revezamento', 'Individual'), ' (', p.sexo, ')') AS nome,
                p.estilo AS prova_estilo,
                p.distancia,
                p.sexo,
                p.eh_revezamento,
                ep.ordem
            FROM 
                eventos_provas ep
            JOIN 
                provas p ON ep.provas_id = p.id
            WHERE 
                ep.eventos_id = ?
            ORDER BY ep.ordem ASC;
    `;
    const [provas] = await db.query(queryProvas, [eventoId]);
    if (provas.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    // Para cada prova, obter as baterias e nadadores e incluir resultado ou "A DISPUTAR"
    const resultadosEvento = [];
    for (const prova of provas) {
      const queryBaterias = `
      SELECT
          b.id AS bateriaId,
          b.descricao AS numeroBateria,
          bi.raia,
          n.id AS nadadorId,
          n.nome AS nomeNadador,
          COALESCE(e.id, eq.id) AS equipeId,  
          COALESCE(e.nome, eq.nome) AS nomeEquipe,  
          c.nome AS categoriaNadador
      FROM baterias b
      INNER JOIN baterias_inscricoes bi ON bi.baterias_id = b.id
      LEFT JOIN inscricoes i ON bi.inscricoes_id = i.id
      LEFT JOIN nadadores n ON i.nadadores_id = n.id
      LEFT JOIN categorias c ON n.categorias_id = c.id
      LEFT JOIN revezamentos_inscricoes ri ON bi.revezamentos_inscricoes_id = ri.id
      LEFT JOIN equipes e ON ri.equipes_id = e.id  -- Equipe em revezamentos
      LEFT JOIN equipes eq ON n.equipes_id = eq.id  -- Equipe de nadadores individuais
      WHERE b.eventos_provas_id = ?
      ORDER BY b.id, bi.raia;
      `;
      const [baterias] = await db.query(queryBaterias, [prova.eventos_provas_id]);

      // Para cada nadador, buscar seu resultado para esta prova
      for (let row of baterias) {
        const equipesProcessadas = new Set(); // Para evitar buscar o mesmo resultado várias vezes

        for (let row of baterias) {
          let resultadoQuery, resultadoParams;
        
          if (prova.eh_revezamento && row.nadadorId === null) { // Se for revezamento e nadadorId for null
            if (!row.equipeId || equipesProcessadas.has(row.equipeId)) { // Se não tiver equipe ou já foi processada
              row.tempo = "A DISPUTAR";
              row.status = null;
              continue; // Evita buscar múltiplas vezes para a mesma equipe
            }
            equipesProcessadas.add(row.equipeId); // Marca a equipe como processada
            resultadoQuery = 'SELECT minutos, segundos, centesimos, status FROM resultados WHERE equipes_id = ? AND eventos_provas_id = ?';
            resultadoParams = [row.equipeId, prova.eventos_provas_id];
          } else if (!prova.eh_revezamento && row.nadadorId !== null) { // Se for prova individual e nadadorId não for null
            resultadoQuery = 'SELECT minutos, segundos, centesimos, status FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ?';
            resultadoParams = [row.nadadorId, prova.eventos_provas_id];
          } else {
            row.tempo = "A DISPUTAR";
            row.status = null;
            continue;
          }
        
          const [resultadoRows] = await db.query(resultadoQuery, resultadoParams);
          if (resultadoRows.length > 0) {
            const { minutos, segundos, centesimos, status } = resultadoRows[0];
            row.tempo = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
            row.status = status === 'DQL' ? 'DQL' : status;
          } else {
            row.tempo = "A DISPUTAR";
            row.status = null;
          }
        }        
      }

      // Organiza as baterias em grupos, cada grupo representa uma bateria
      const bateriasOrganizadas = baterias.reduce((acc, row) => {
        let bateria = acc.find(b => b.bateriaId === row.bateriaId);
        if (!bateria) {
          bateria = {
            bateriaId: row.bateriaId,
            numeroBateria: row.numeroBateria,
            nadadores: [],
          };
          acc.push(bateria);
        }
        const nadadorData = { // Dados do nadador
          id: row.nadadorId,
          raia: row.raia,
          tempo: row.tempo,
          status: row.status,
          equipe: row.nomeEquipe
        };
        if (!prova.eh_revezamento) { // Se não for revezamento
          nadadorData.nome = row.nomeNadador;
          nadadorData.categoria = row.categoriaNadador;
        }        
        bateria.nadadores.push(nadadorData);
        return acc;
      }, []);

      resultadosEvento.push({
        prova: {
          eventos_provas_id: prova.eventos_provas_id,
          prova_id: prova.prova_id,
          nome: prova.nome,
          ordem: prova.ordem,
          revezamento: prova.eh_revezamento === 1 // Use the boolean field
        },
        baterias: bateriasOrganizadas,
      });
    }

    res.json(resultadosEvento);
  } catch (error) {
    console.error('Erro ao buscar resultados:', error.message);
    res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

router.get('/resultadosPorCategoria/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        // Buscar resultados com provas, categorias e sexo
        const [resultados] = await db.query(`
            SELECT 
                r.id AS resultadoId,
                r.nadadores_id AS nadadorId,
                n.nome AS nomeNadador,
                n.equipes_id AS equipeId,
                e.nome AS nomeEquipe,
                c.id AS categoriaId,
                c.nome AS categoria,
                n.sexo AS sexoNadador,
                ep.id AS eventosProvasId,
                p.id AS provaId,
                p.sexo AS sexoProva,
                CONCAT(p.estilo, ' ', p.distancia, 'm') AS nomeProva,
                r.minutos,
                r.segundos,
                r.centesimos,
                r.status,
                p.eh_revezamento,
                p.eh_prova_categoria  -- Ensure this field is selected
            FROM resultados r
            LEFT JOIN nadadores n ON r.nadadores_id = n.id
            LEFT JOIN categorias c ON n.categorias_id = c.id
            LEFT JOIN equipes e ON COALESCE(r.equipes_id, n.equipes_id) = e.id
            JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
            JOIN provas p ON ep.provas_id = p.id
            WHERE ep.eventos_id = ?
            ORDER BY p.eh_revezamento ASC, p.id ASC, c.id ASC, n.sexo ASC, r.minutos ASC, r.segundos ASC, r.centesimos ASC;
        `, [eventoId]);

        // Agrupar por prova, categoria e sexo (revezamento separado por sexo)
        const classificacao = {};
        resultados.forEach(row => {
            const provaKey = row.eh_revezamento 
                ? `Revezamento - ${row.nomeProva} (${row.sexoProva})` 
                : `${row.nomeProva} - ${row.categoria} (${row.sexoNadador})`;

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

        // Adicionar posição no ranking dentro de cada prova + categoria + sexo
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
        console.error('Erro ao buscar resultados por categoria e prova:', error.message);
        res.status(500).json({ error: 'Erro ao buscar resultados' });
    }
});

router.get('/resultadosAbsoluto/:eventoId', async (req, res) => {
    const { eventoId } = req.params;

    try {
        // Buscar resultados com provas, sexo e categoria
        const [resultados] = await db.query(`
          SELECT 
              c.id, 
              c.eventos_provas_id, 
              p.id AS prova_id, 
              CONCAT(p.distancia, 'm', ' ', p.estilo) AS prova_nome, 
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
              c.pontuacao_individual,  -- 👈 Adicionamos a pontuação individual
              c.pontuacao_equipe,      -- 👈 Adicionamos a pontuação da equipe
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

router.get('/listarDoBanco/:eventoId', async (req, res) => {
  const { eventoId } = req.params;

  try {
    // Buscar resultados do banco
    const [resultados] = await db.query(`
      SELECT 
        c.id, 
        c.eventos_provas_id, 
        p.id AS prova_id, 
        CONCAT(p.distancia, 'm', ' ', p.estilo) AS prova_nome, 
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
        c.pontuacao_individual,  -- Adiciona a pontuação individual
        c.pontuacao_equipe,      -- Adiciona a pontuação da equipe
        ep.ordem  -- Add ordem column
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

router.post('/atualizar-recordes/:torneioId', async (req, res) => {
  try {
      const { torneioId } = req.params;

      // 1️⃣ Buscar tempos individuais (excluindo revezamentos)
      const [resultados] = await db.execute(
          `SELECT r.nadadores_id, ep.provas_id, e.torneios_id, r.minutos, r.segundos, r.centesimos, e.id AS eventos_id
           FROM resultados r
           JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
           JOIN eventos e ON ep.eventos_id = e.id
           JOIN provas p ON ep.provas_id = p.id
           WHERE r.status = 'OK' 
           AND e.torneios_id = ?
           AND p.eh_revezamento = 0`, // ⛔ Exclui revezamentos
          [torneioId]
      );

      for (const resultado of resultados) {
          const tempoNovo = calcularTempoEmCentesimos(resultado.minutos, resultado.segundos, resultado.centesimos);

          // 2️⃣ Verificar recorde atual do nadador na prova
          const [recordAtual] = await db.execute(
              `SELECT minutos, segundos, centesimos 
               FROM records 
               WHERE nadadores_id = ? AND provas_id = ? AND torneios_id = ?`,
              [resultado.nadadores_id, resultado.provas_id, torneioId]
          );

          if (recordAtual.length === 0) {
              // 3️⃣ Se não existir recorde, inserir novo tempo
              await db.execute(
                  `INSERT INTO records (nadadores_id, provas_id, torneios_id, eventos_id, minutos, segundos, centesimos)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [resultado.nadadores_id, resultado.provas_id, torneioId, resultado.eventos_id, resultado.minutos, resultado.segundos, resultado.centesimos]
              );
          } else {
              // 4️⃣ Comparar com recorde atual
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

      res.status(200).json({ success: "Recordes atualizados com sucesso!" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar recordes." });
  }
});

module.exports = router;