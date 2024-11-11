// rankingsRoute.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo resultados.json
const jsonFilePath = path.join(__dirname, '../../frontend/src/json', 'resultados.json');

// Função para ler e analisar o arquivo JSON
const readJsonFile = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
            if (err) {
                reject('Erro ao ler o arquivo JSON');
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject('Erro ao analisar o arquivo JSON');
                }
            }
        });
    });
};

// Rota para retornar todos os resultados
router.get('/resultados', async (req, res) => {
    try {
        const jsonData = await readJsonFile();
        res.json(jsonData);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Rota para listar todas as equipes do JSON
router.get('/listaEquipes', async (req, res) => {
    try {
        const jsonData = await readJsonFile();
        // Extrai o campo "Equipe" e remove duplicatas
        const equipes = [...new Set(jsonData.map(item => item.Equipe))].filter(Boolean);
        res.json(equipes.map(nome => ({ nome })));
    } catch (error) {
        console.error('Erro ao listar equipes:', error);
        res.status(500).send('Erro ao listar equipes');
    }
});

// Rota para listar todas as provas do JSON
router.get('/listaProvas', async (req, res) => {
    try {
        const jsonData = await readJsonFile();
        // Extrai o campo "Nado" e remove duplicatas
        const provas = [...new Set(jsonData.map(item => item.Nado))].filter(Boolean);
        res.json(provas.map(descricao => ({ descricao })));
    } catch (error) {
        console.error('Erro ao listar provas:', error);
        res.status(500).send('Erro ao listar provas');
    }
});

module.exports = router;
