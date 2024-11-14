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

router.get('/resultados', async (req, res) => {
    const { equipe } = req.query;

    try {
        const jsonData = await readJsonFile();  // Carrega os dados JSON

        const filteredData = jsonData.filter(item => {
            const equipeMatch = equipe ? item.Equipe === equipe : true;  // Filtro por equipe

            return equipeMatch;  // Retorna true se passar em ambos os filtros
        });

        res.json(filteredData);  // Retorna os dados filtrados
    } catch (error) {
        console.error('Erro ao ler arquivo ou filtrar dados:', error);
        res.status(500).send(error.message || 'Erro interno do servidor.');
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


module.exports = router;
