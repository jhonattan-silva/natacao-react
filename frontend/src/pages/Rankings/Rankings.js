import React, { useEffect, useState } from 'react';
import api from '../../servicos/api';
import Tabela from '../../componentes/Tabela/Tabela';
import style from './Rankings.module.css';

const Rankings = () => {
    const [rankings, setRankings] = useState([]);
    const [error, setError] = useState(null);

    const apiRanking = `/rankings/resultados`;

    // Buscar rankings agregados
    const fetchRankings = async () => {
        try {
            console.log('Buscando rankings agregados');
            const response = await api.get(apiRanking);
            if (!Array.isArray(response.data)) {
                throw new Error(`Resposta inesperada: ${JSON.stringify(response.data)}`);
            }
            setRankings(response.data);
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar dados do ranking:', err);
            setError(`Erro ao buscar rankings: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, []);

    return (
        <div className={style.rankings}>
            <h1>Rankings</h1>
            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>Erro:</strong> {error}
                </div>
            )}
            {rankings.length > 0 ? (
                <Tabela dados={rankings} />
            ) : (
                <p>Nenhum dado disponível para o ranking.</p>
            )}
        </div>
    );
};

export default Rankings;
