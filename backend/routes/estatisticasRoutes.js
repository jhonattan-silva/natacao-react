const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 📌 Estatísticas de Inscrições por Equipe (Com Nadadores e Provas)
router.get('/inscricoesEquipe/:equipesId', async (req, res) => {
    try {
        const { equipesId } = req.params;

        // Consulta para obter o total de inscrições da equipe da tabela inscricoes
        const [totalInscricoes] = await db.execute(`
            SELECT COUNT(DISTINCT n.id) AS total_inscricoes
            FROM inscricoes i
            JOIN nadadores n ON i.nadadores_id = n.id
            JOIN eventos ev ON i.eventos_id = ev.id
            JOIN equipes e ON n.equipes_id = e.id
            WHERE ev.inscricao_aberta = 1 AND e.id = ?
        `, [equipesId]);

        // Consulta para obter o total de inscrições de revezamentos
        const [totalRevezamentos] = await db.execute(`
            SELECT COUNT(id) AS total_revezamentos
            FROM revezamentos_inscricoes
            WHERE equipes_id = ?
        `, [equipesId]);

        // Consulta para obter a lista de nadadores e suas provas
        const [nadadores] = await db.execute(`
            SELECT n.id AS nadador_id, n.nome AS nadador_nome, n.sexo AS nadador_sexo, CONCAT(p.distancia, "m", ' ', p.estilo) AS prova
            FROM inscricoes i
            JOIN nadadores n ON i.nadadores_id = n.id
            JOIN eventos ev ON i.eventos_id = ev.id
            JOIN eventos_provas ep ON i.eventos_provas_id = ep.id
            JOIN provas p ON ep.provas_id = p.id
            WHERE n.equipes_id = ? AND ev.inscricao_aberta = 1
            ORDER BY n.sexo, n.nome
        `, [equipesId]);

        // Consulta para obter as provas de revezamento onde há inscrições
        const [revezamentos] = await db.execute(`
            SELECT CONCAT(p.distancia, "m", ' ', p.estilo, ' ', p.sexo) AS prova_revezamento
            FROM revezamentos_inscricoes ri
            JOIN eventos_provas ep ON ri.eventos_provas_id = ep.id
            JOIN provas p ON ep.provas_id = p.id
            JOIN eventos ev ON ep.eventos_id = ev.id
            WHERE ri.equipes_id = ? AND ev.inscricao_aberta = 1;
        `, [equipesId]);

        // Agrupar nadadores e suas provas com o sexo disponível
        const atletas = {};
        nadadores.forEach(({ nadador_id, nadador_nome, nadador_sexo, prova }) => {
            if (!atletas[nadador_id]) {
                atletas[nadador_id] = { nome: nadador_nome, sexo: nadador_sexo, provas: [] };
            }
            atletas[nadador_id].provas.push(prova);
        });

        // Ordenar o array final de atletas com base no sexo e nome
        const atletasOrdered = Object.values(atletas).sort((a, b) => {
            if(a.sexo !== b.sexo) return a.sexo.localeCompare(b.sexo);
            return a.nome.localeCompare(b.nome);
        });

        res.status(200).json({
            total_inscricoes: totalInscricoes[0]?.total_inscricoes || 0,
            total_revezamentos: totalRevezamentos[0]?.total_revezamentos || 0,
            atletas: atletasOrdered,
            provas_revezamento: revezamentos.map(r => r.prova_revezamento),
        });
    } catch (error) {
        console.error("Erro ao buscar inscrições da equipe:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

// 📌 2. Estatísticas Gerais das Equipes (Total de Equipes Cadastradas)
router.get('/equipes', async (req, res) => {
    try {
        // Contar o total de equipes que fizeram pelo menos uma inscrição em eventos abertos
        const [totalEquipesComInscricao] = await db.execute(`
            SELECT COUNT(DISTINCT e.id) AS total_equipes
            FROM equipes e
            JOIN nadadores n ON e.id = n.equipes_id
            JOIN inscricoes i ON n.id = i.nadadores_id
            JOIN eventos ev ON i.eventos_id = ev.id
            WHERE ev.inscricao_aberta = 1
        `);

        // Contar o total de nadadores que estão inscritos em eventos abertos
        const [totalNadadoresInscritos] = await db.execute(`
            SELECT COUNT(DISTINCT i.nadadores_id) AS total_atletas
            FROM inscricoes i
            JOIN eventos ev ON i.eventos_id = ev.id
            WHERE ev.inscricao_aberta = 1
        `);

        res.status(200).json({
            total: totalEquipesComInscricao[0]?.total_equipes || 0,
            atletas: totalNadadoresInscritos[0]?.total_atletas || 0,
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas de equipes:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});


// 📌 3. Estatísticas de Inscrições por Evento
router.get('/inscricoesEvento', async (req, res) => {
    try {
        const [dados] = await db.execute(`
            SELECT ev.nome AS evento, ev.data, COUNT(i.id) AS total_inscritos
            FROM inscricoes i
            JOIN eventos ev ON i.eventos_id = ev.id
            GROUP BY ev.id
            ORDER BY ev.data DESC
        `);
        res.status(200).json(dados);
    } catch (error) {
        console.error("Erro ao buscar estatísticas de inscrições por evento:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

// 📌 4. Estatísticas de Inscrições por Categoria
router.get('/inscricoesCategoria', async (req, res) => {
    try {
        const [dados] = await db.execute(`
            SELECT c.nome AS categoria, COUNT(i.id) AS total_inscritos
            FROM inscricoes i
            JOIN nadadores n ON i.nadadores_id = n.id
            JOIN categorias c ON n.categorias_id = c.id
            GROUP BY c.id
            ORDER BY total_inscritos DESC
        `);
        res.status(200).json(dados);
    } catch (error) {
        console.error("Erro ao buscar estatísticas de inscrições por categoria:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

module.exports = router;
