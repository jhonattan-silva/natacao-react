const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/vincula-equipes', async (req, res) => {
    try {
        console.log('Iniciando atualização de equipes_id para nadadores...');

        // Atualiza o equipes_id nos nadadores com base nos dados da tabela temporária
        const [result] = await db.query(`
            UPDATE nadadores
            JOIN temp ON temp.nome = nadadores.nome
            JOIN equipes ON temp.equipe = equipes.nome
            SET nadadores.equipes_id = equipes.id;
        `);

        console.log('Nadadores atualizados:', result.affectedRows);
        res.send(`Nadadores atualizados com sucesso: ${result.affectedRows}`);
    } catch (error) {
        console.error('Erro ao atualizar equipes_id:', error.message);
        res.status(500).send('Erro ao atualizar equipes_id nos nadadores.');
    }
});

//AJUSTES NA TABELA TEMP PARA FACILITAR AS MIGRAÇ~EOS
router.post('/add-prova-id-temp', async (req, res) => {
    try {
        console.log('Iniciando atualização de prova_id na tabela temporária...');

        // Atualiza o prova_id na tabela temp
        const [result] = await db.query(`
            UPDATE temp
            JOIN provas
            ON CAST(SUBSTRING_INDEX(temp.Nado, 'm', 1) AS UNSIGNED) = provas.distancia
               AND SUBSTRING_INDEX(SUBSTRING_INDEX(temp.Nado, ' ', -2), ' ', 1) = provas.estilo
               AND (SUBSTRING_INDEX(temp.Nado, ' ', -1) = 'Masculino' AND provas.sexo = 'M'
                    OR SUBSTRING_INDEX(temp.Nado, ' ', -1) = 'Feminino' AND provas.sexo = 'F')
            SET temp.prova_id = provas.id;
        `);

        console.log('Provas atualizadas:', result.affectedRows);
        res.send(`Provas atualizadas com sucesso: ${result.affectedRows}`);
    } catch (error) {
        console.error('Erro ao atualizar prova_id:', error.message);
        res.status(500).send('Erro ao atualizar prova_id.');
    }
});

router.post('/add-nadador-id-temp', async (req, res) => {
    try {
        console.log('Iniciando atualização de nadador_id na tabela temporária...');

        // Atualiza o nadador_id na tabela temp
        const [result] = await db.query(`
            UPDATE temp
            JOIN nadadores ON temp.Nome = nadadores.nome
            SET temp.nadador_id = nadadores.id;
        `);

        console.log('Nadadores atualizados na tabela temp:', result.affectedRows);
        res.send(`Nadadores atualizados com sucesso: ${result.affectedRows}`);
    } catch (error) {
        console.error('Erro ao atualizar nadador_id:', error.message);
        res.status(500).send('Erro ao atualizar nadador_id na tabela temp.');
    }
});




module.exports = router;
