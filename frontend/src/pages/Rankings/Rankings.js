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
    const [error, setError] = useState(null); // Armazena erros para exibição na interface

    const apiRanking = `/rankings/resultados`;
    const apiEquipes = `/rankings/listaEquipes`;

    // Atualiza equipe selecionada
    const equipeSelecionada = (id) => {
        setEquipeId(id);
    };

    // Buscar equipes para a ListaSuspensa
    useEffect(() => {
        const fetchEquipes = async () => {
            try {
                const response = await api.get(apiEquipes);
                if (Array.isArray(response.data)) {
                    setEquipeId(response.data[0]?.id || ''); // Seleciona o primeiro item como padrão
                    setError(null); // Limpa erros anteriores
                } else {
                    console.error('ERRO: A resposta das equipes não é um array');
                    setError('A resposta do servidor para as equipes é inválida.');
                }
            } catch (err) {
                console.error('Erro ao buscar dados de equipes:', err);
                setError(`Erro ao buscar equipes: ${err.message}`);
            }
        };
        fetchEquipes();
    }, [apiEquipes]);

    // Buscar rankings
    const fetchRankings = async () => {
        try {
            const url = `${apiRanking}?${equipeId ? `equipe=${equipeId}` : ''}`;
            console.log('Buscando rankings em:', url);

            const response = await api.get(url);

            if (!Array.isArray(response.data)) {
                throw new Error(`Resposta inesperada: ${JSON.stringify(response.data)}`);
            }

            const groupedData = response.data.reduce((acc, item) => {
                const { Nado } = item;
                acc[Nado] = acc[Nado] || [];
                acc[Nado].push(item);
                return acc;
            }, {});

            setRankings(groupedData);
            setError(null); // Limpa erros anteriores
        } catch (err) {
            console.error('Erro ao buscar dados do ranking:', err);
            setError(`Erro ao buscar rankings: ${err.message}`);
        }
    };

    // Atualizar rankings ao mudar `equipeId`
    useEffect(() => {
        if (equipeId) {
            fetchRankings();
        }
    }, [equipeId]);

    // Botão de Filtrar
    const filtrarClick = () => {
        setFiltroAtivo(true);
        fetchRankings(); // Recarrega os rankings
    };

    return (
        <div className={style.rankings}>
            <h1>Rankings</h1>
            <div className={style.filtroContainer}>
                <ListaSuspensa
                    textoPlaceholder="Selecione uma Equipe"
                    fonteDados={apiEquipes}
                    onChange={equipeSelecionada}
                />
                <Botao onClick={filtrarClick} classBtn={style.btnFiltrar}>
                    FILTRAR
                </Botao>
            </div>
            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>Erro:</strong> {error}
                </div>
            )}
            {Object.keys(rankings).length > 0 ? (
                Object.keys(rankings).map((nado) => (
                    <div key={nado}>
                        <h2>{nado}</h2>
                        <Tabela dados={rankings[nado]} />
                    </div>
                ))
            ) : (
                <p>Nenhum dado disponível para o ranking.</p>
            )}
        </div>
    );
};

export default Rankings;
