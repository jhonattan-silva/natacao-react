import React, { useEffect, useState } from 'react';
import api from '../../servicos/api';
import Tabela from '../../componentes/Tabela/Tabela';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import style from './Rankings.module.css';
import Botao from '../../componentes/Botao/Botao';

const Rankings = () => {
    const [rankings, setRankings] = useState({});
    const [equipeId, setEquipeId] = useState(''); //captura o id do equipe
    const [filtroAtivo, setFiltroAtivo] = useState(false); // Estado para monitorar o clique no botão "Filtrar"

    const apiRanking = `/rankings/resultados`;
    const apiEquipes = `/rankings/listaEquipes`;

    const equipeSelecionada = (id) => {
        setEquipeId(id);
    };

    //buscar equipes para a listasuspensa = SELECT
    useEffect(() => {
        const fetchEquipes = async () => {
            try {
                const response = await api.get(apiEquipes);
                if (Array.isArray(response.data)) {
                    setEquipeId(response.data[0]?.id || ''); // Preenche a equipe selecionada com o primeiro item, se houver
                } else {
                    console.error('ERRO: A resposta das equipes não é um array');
                }
            } catch (error) {
                if (error.code === 'ERR_NETWORK') {
                    console.error('Erro de REDE', error);
                } else {
                    console.error('Erro ao buscar dados de equipes:', error);
                }
            }
        };
        fetchEquipes();
    }, [apiEquipes]);

    // Função para buscar os rankings e exibir todos os dados por padrão
    const fetchRankings = async () => {
        try {
            const url = `${apiRanking}?${equipeId ? `equipe=${equipeId}` : ''}`;
            const response = await api.get(url);

            const groupedData = response.data.reduce((acc, item) => {
                const { Nado } = item;
                acc[Nado] = acc[Nado] || [];
                acc[Nado].push(item);
                return acc;
            }, {});
            setRankings(groupedData);
        } catch (error) {
            if (error.code === 'ERR_NETWORK') {
                console.error("Erro de REDE ao buscar o ranking", error);
            } else {
                console.error('Erro ao buscar dados do ranking:', error);
            }
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
            <div className={style.filtroContainer}>
                <ListaSuspensa
                    textoPlaceholder="Selecione uma Equipe"
                    fonteDados={apiEquipes}
                    onChange={equipeSelecionada} />
                <Botao onClick={filtrarClick} classBtn={style.btnFiltrar}>FILTRAR</Botao>
            </div>
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
