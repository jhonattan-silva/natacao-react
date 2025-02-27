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
            row.status = status;
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
                p.eh_revezamento
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
            if (row.status === 'DESC') {
                row.tempo = 'DESCLASSIFICADO';
                row.classificacao = 'DESCLASSIFICADO';
            } else if (row.status === 'NC' || (row.minutos === 0 && row.segundos === 0 && row.centesimos === 0)) {
                row.tempo = 'NÃO COMPARECEU';
                row.classificacao = 'NÃO COMPARECEU';
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

// Rota para gerar pontuação com base no eventos_id
router.post('/gerarPontuacao/:eventosId', async (req, res) => {
  const { eventosId } = req.params;

  // Consulta para buscar todas as provas associadas a um evento
  const queryBuscarProvas = `
    SELECT id 
    FROM eventos_provas 
    WHERE eventos_id = ?;
  `;

  // Consulta para atualizar a pontuação
  const queryAtualizarPontuacao = `
    UPDATE resultados r
    JOIN (
        SELECT 
            r.id,
            CASE 
                WHEN p.eh_revezamento = 1 THEN 
                    CASE 
                        WHEN r.status = 'OK' THEN 
                            CASE 
                                WHEN (@row_number := @row_number + 1) = 1 THEN 18
                                WHEN @row_number = 2 THEN 14
                                WHEN @row_number = 3 THEN 12
                                WHEN @row_number = 4 THEN 10
                                WHEN @row_number = 5 THEN 8
                                WHEN @row_number = 6 THEN 6
                                WHEN @row_number = 7 THEN 4
                                WHEN @row_number = 8 THEN 2
                                ELSE 0
                            END
                        ELSE 0
                    END
                ELSE 
                    CASE 
                        WHEN r.status = 'OK' THEN 
                            CASE 
                                WHEN (@row_number := @row_number + 1) = 1 THEN 9
                                WHEN @row_number = 2 THEN 7
                                WHEN @row_number = 3 THEN 6
                                WHEN @row_number = 4 THEN 5
                                WHEN @row_number = 5 THEN 4
                                WHEN @row_number = 6 THEN 3
                                WHEN @row_number = 7 THEN 2
                                WHEN @row_number = 8 THEN 1
                                ELSE 0
                            END
                        ELSE 0
                    END
            END AS pontos
        FROM resultados r
        JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
        JOIN provas p ON ep.provas_id = p.id
        WHERE r.eventos_provas_id = ?
        ORDER BY p.eh_revezamento DESC, r.minutos ASC, r.segundos ASC, r.centesimos ASC
    ) AS ranking ON r.id = ranking.id
    SET r.pontos = ranking.pontos;
  `;

  try {
    // Buscar todas as provas associadas ao evento
    const [provas] = await db.query(queryBuscarProvas, [eventosId]);

    for (const prova of provas) {
      await db.query('SET @row_number = 0;');
      await db.query(queryAtualizarPontuacao, [prova.id]);
    }

    res.status(200).json({ message: 'Pontuação gerada com sucesso' });
  } catch (error) {
    console.error('Erro ao gerar pontuação:', error.message);
    res.status(500).json({ error: 'Erro ao gerar pontuação' });
  }
});

// Rota para verificar os registros que seriam afetados
router.get('/verificarPontuacao/:eventosId', async (req, res) => {
  const { eventosId } = req.params;

  const queryVerificarPontuacao = `
    SELECT 
        r.id,
        r.prova_id,
        CASE 
            WHEN r.eh_revezamento = 1 THEN 
                CASE 
                    WHEN r.status = 'OK' THEN 
                        CASE 
                            WHEN (@row_number := IF(@current_prova = r.prova_id, @row_number + 1, 1)) = 1 THEN 18
                            WHEN @row_number = 2 THEN 14
                            WHEN @row_number = 3 THEN 12
                            WHEN @row_number = 4 THEN 10
                            WHEN @row_number = 5 THEN 8
                            WHEN @row_number = 6 THEN 6
                            WHEN @row_number = 7 THEN 4
                            WHEN @row_number = 8 THEN 2
                            ELSE 0
                        END
                    ELSE 0
                END
            ELSE 
                CASE 
                    WHEN r.status = 'OK' THEN 
                        CASE 
                            WHEN (@row_number := IF(@current_prova = r.prova_id, @row_number + 1, 1)) = 1 THEN 9
                            WHEN @row_number = 2 THEN 7
                            WHEN @row_number = 3 THEN 6
                            WHEN @row_number = 4 THEN 5
                            WHEN @row_number = 5 THEN 4
                            WHEN @row_number = 6 THEN 3
                            WHEN @row_number = 7 THEN 2
                            WHEN @row_number = 8 THEN 1
                            ELSE 0
                        END
                    ELSE 0
                END
        END AS pontos,
        @current_prova := r.prova_id AS dummy
    FROM (
        SELECT r.*, p.eh_revezamento, p.id AS prova_id
        FROM resultados r
        JOIN eventos_provas ep ON r.eventos_provas_id = ep.id
        JOIN provas p ON ep.provas_id = p.id
        WHERE ep.eventos_id = ?
        ORDER BY p.eh_revezamento DESC, p.id, r.minutos ASC, r.segundos ASC, r.centesimos ASC
    ) AS r
    JOIN (SELECT @row_number := 0, @current_prova := 0) AS rn;
  `;

  try {
    const [result] = await db.query(queryVerificarPontuacao, [eventosId]);
    res.json(result);
  } catch (error) {
    console.error('Erro ao verificar pontuação:', error.message);
    res.status(500).json({ error: 'Erro ao verificar pontuação' });
  }
});

module.exports = router;