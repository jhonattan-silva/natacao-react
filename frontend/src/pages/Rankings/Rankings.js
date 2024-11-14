import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Tabela from '../../componentes/Tabela/Tabela';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import style from './Rankings.module.css';
import Botao from '../../componentes/Botao/Botao';

const Rankings = () => {
    const [rankings, setRankings] = useState({});
    const [equipeId, setEquipeId] = useState(''); //captura o id do equipe
    const [filtroAtivo, setFiltroAtivo] = useState(false); // Estado para monitorar o clique no botão "Filtrar"


    const baseUrl = 'http://localhost:5000/api/rankings';

    const apiRanking = `${baseUrl}/resultados`;
    const apiEquipes = `${baseUrl}/listaEquipes`;

    const equipeSelecionada = (id) => {
        setEquipeId(id);
    };

    //buscar equipes para a listasuspensa = SELECT
     useEffect(() => {
        const fetchEquipes = async () => {
            try {
                const response = await axios.get(apiEquipes);
                setEquipeId(response.data[0]?.id || ''); // Preenche a equipe selecionada com o primeiro item, se houver
            } catch (error) {
                console.error('Erro ao buscar dados de equipes:', error);
            }
        };
        fetchEquipes();
    }, [apiEquipes]);

    // Função para buscar os rankings e exibir todos os dados por padrão
    const fetchRankings = async () => {
        try {
            const url = `${apiRanking}?${equipeId ? `equipe=${equipeId}` : ''}`;
            const response = await axios.get(url);
    
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
    
    

    // Chama a função para buscar rankings ao carregar o componente
    useEffect(() => {
        fetchRankings(); // Carrega todos os rankings ao iniciar
    }, []); // O array vazio significa que isso acontecerá apenas uma vez, ao carregar o componente

    // Função de clique do botão "Filtrar"
    const filtrarClick = () => {
        setFiltroAtivo(true);
        console.log("EQUIPE ESCOLHIDA", equipeId);

        fetchRankings(equipeId); // Aplica o filtro e busca novamente os dados
    };

    return (
        <div className={style.rankings}>
            <h1>Rankings</h1>
            <ListaSuspensa
                textoPlaceholder="Selecione uma Equipe"
                fonteDados={apiEquipes}
                onChange={equipeSelecionada} />
            <Botao onClick={filtrarClick} classBtn={style.btnFiltrar}>FILTRAR</Botao>
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
