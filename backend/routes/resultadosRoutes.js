const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/resultadosEvento/:eventoId', async (req, res) => {
  const { eventoId } = req.params;
  try {
    // Query para listar todas as provas do evento
    const queryProvas = `
      SELECT DISTINCT
        ep.id AS eventos_provas_id,
        p.id AS prova_id,
        CONCAT(p.estilo, ' ', p.distancia, 'm ', p.tipo, ' (', p.sexo, ')') AS prova_nome,
        ep.ordem
      FROM inscricoes i
      JOIN eventos_provas ep ON i.Eventos_Provas_id = ep.id
      JOIN provas p ON ep.provas_id = p.id
      WHERE i.Eventos_id = ?
      ORDER BY ep.ordem ASC
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
          e.nome AS equipe,
          c.nome AS categoria
        FROM baterias b
        INNER JOIN baterias_inscricoes bi ON bi.Baterias_id = b.id
        INNER JOIN inscricoes i ON bi.Inscricoes_id = i.id
        INNER JOIN nadadores n ON i.Nadadores_id = n.id
        INNER JOIN equipes e ON n.equipes_id = e.id
        INNER JOIN categorias c ON n.categorias_id = c.id
        WHERE b.Provas_id = ?
        ORDER BY b.id, bi.raia
      `;
      const [baterias] = await db.query(queryBaterias, [prova.prova_id]);

      // Para cada nadador, buscar seu resultado para esta prova
      for (let row of baterias) {
        const [resultadoRows] = await db.query(
          'SELECT tempo, status FROM resultados WHERE nadadores_id = ? AND eventos_provas_id = ?',
          [row.nadadorId, prova.eventos_provas_id]
        );
        if (resultadoRows.length > 0) {
          row.tempo = resultadoRows[0].tempo;
          row.status = resultadoRows[0].status;
        } else {
          row.tempo = "A DISPUTAR";
          row.status = null;
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
        bateria.nadadores.push({
          id: row.nadadorId,
          nome: row.nomeNadador,
          raia: row.raia,
          tempo: row.tempo,
          status: row.status,
          equipe: row.equipe,
          categoria: row.categoria,
        });
        return acc;
      }, []);

      resultadosEvento.push({
        prova: {
          eventos_provas_id: prova.eventos_provas_id,
          prova_id: prova.prova_id,
          nome: prova.prova_nome,
          ordem: prova.ordem,
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

module.exports = router;
