import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Tabela from '../../componentes/Tabela/Tabela';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';

const Rankings = () => {
    const [rankings, setRankings] = useState({});
    const [equipeId, setEquipeId] = useState(''); //captura o id do equipe
    const [provaId, setProvaId] = useState(''); //captura o id do prova


    const baseUrl = 'http://localhost:5000/api/rankings';

    const apiRanking = `${baseUrl}/resultados`;
    const apiEquipes = `${baseUrl}/listaEquipes`;
    const apiProvas = `${baseUrl}/listaProvas`;

    const equipeSelecionada = (id) => {
        setEquipeId(id);
    };

    const provaSelecionada = (id) => {
        setProvaId(id);
    };

    //buscar eventos para a listasuspensa = SELECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(apiEquipes);
                setEquipeId(response.data); // Preenche os eventos para a lista suspensa
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, [apiEquipes]);

    //buscar eventos para a listasuspensa = SELECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(apiProvas);
                setProvaId(response.data); // Preenche os eventos para a lista suspensa
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, [apiProvas]);

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await axios.get(apiRanking);
                // Organiza os dados por tipo de prova (Nado)
                const groupedData = response.data.reduce((acc, item) => {
                    const { Nado } = item;
                    acc[Nado] = acc[Nado] || [];
                    acc[Nado].push(item);
                    return acc;
                }, {});

                setRankings(groupedData);
            } catch (error) {
                console.error('Erro ao buscar dados do ranking:', error);
            }
        };

        fetchRankings();
    }, []);

    return (
        <div>
            <h1>Rankings</h1>
            <ListaSuspensa
                textoPlaceholder="Selecione uma Equipe"
                fonteDados={apiEquipes}
                onChange={equipeSelecionada} />
            <ListaSuspensa
                textoPlaceholder="Selecione uma Prova"
                fonteDados={apiProvas}
                onChange={provaSelecionada} />
            {Object.keys(rankings).map((nado) => (
                <div key={nado}>
                    <h2>{nado}</h2>
                    <Tabela dados={rankings[nado]} />
                </div>
            ))}
        </div>
    );
};

export default Rankings;
