import React, { useEffect, useState } from 'react';
import api from '../../servicos/api';
import Tabela from '../../componentes/Tabela/Tabela';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import style from './Rankings.module.css';
import Botao from '../../componentes/Botao/Botao';

const Rankings = () => {
    const [rankings, setRankings] = useState({});
    const [equipeId, setEquipeId] = useState(''); // Captura o ID da equipe
    const [filtroAtivo, setFiltroAtivo] = useState(false); // Estado para monitorar o clique no botão "Filtrar"

    // Atualiza o estado com a equipe selecionada
    const equipeSelecionada = (id) => {
        setEquipeId(id);
    };

    // Buscar equipes para a lista suspensa (SELECT)
    useEffect(() => {
        const fetchEquipes = async () => {
            try {
                const response = await api.get('/listaEquipes'); // Requisição usando o Axios configurado
                setEquipeId(response.data[0]?.id || ''); // Preenche a equipe selecionada com o primeiro item, se houver
            } catch (error) {
                if (error.code === 'ERR_NETWORK') {
                    console.error('Erro de REDE', error);
                } else {
                    console.error('Erro ao buscar dados de equipes:', error);
                }
            }
        };
        fetchEquipes();
    }, []);

    // Função para buscar os rankings e exibir todos os dados por padrão
    const fetchRankings = async () => {
        try {
            const url = `/resultados?${equipeId ? `equipe=${equipeId}` : ''}`;
            const response = await api.get(url); // Requisição usando o Axios configurado

            // Agrupa os dados por "Nado"
            const groupedData = response.data.reduce((acc, item) => {
                const { Nado } = item;
                acc[Nado] = acc[Nado] || [];
                acc[Nado].push(item);
                return acc;
            }, {});

            setRankings(groupedData);
        } catch (error) {
            if (error.code === 'ERR_NETWORK') {
                console.error('Erro de REDE ao buscar o ranking', error);
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
        console.log('EQUIPE ESCOLHIDA', equipeId);

        fetchRankings(); // Aplica o filtro e busca novamente os dados
    };

    return (
        <div className={style.rankings}>
            <h1>Rankings</h1>
            <div className={style.filtroContainer}>
                <ListaSuspensa
                    textoPlaceholder="Selecione uma Equipe"
                    fonteDados="/listaEquipes" // Endpoint relativo
                    onChange={equipeSelecionada}
                />
                <Botao onClick={filtrarClick} classBtn={style.btnFiltrar}>
                    FILTRAR
                </Botao>
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
