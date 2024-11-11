import React, { useState } from 'react';
import PropTypes from 'prop-types';
import style from './Tabela.module.css';

const Tabela = ({ dados }) => {
    const [ordenaConfig, setOrdenaConfig] = useState({ key: null, direction: 'asc' }); //para ordenação

    const sortedData = React.useMemo(() => {
        if (!dados || dados.length === 0) return [];

        const sortableItems = [...dados];
        if (ordenaConfig.key) {
            sortableItems.sort((a, b) => {
                if (a[ordenaConfig.key] < b[ordenaConfig.key]) return ordenaConfig.direction === 'asc' ? -1 : 1;
                if (a[ordenaConfig.key] > b[ordenaConfig.key]) return ordenaConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [dados, ordenaConfig]);

     // Define a configuração de ordenação ao clicar no cabeçalho da coluna
     const ordenar = (key) => {
        let direction = 'asc';
        if (ordenaConfig.key === key && ordenaConfig.direction === 'asc') {
            direction = 'desc';
        }
        setOrdenaConfig({ key, direction });
    };



    if (!dados || dados.length === 0) {
        return <p>Nenhum dado disponível.</p>;
    }

    return (
        <table className={style.tabela}>
            <thead>
                <tr>
                    {Object.keys(dados[0]).map((coluna) => (
                        <th
                            key={coluna}
                            onClick={() => ordenar(coluna)}
                            style={{ cursor: 'pointer' }}
                        >
                            {coluna}
                            {ordenaConfig.key === coluna && (
                                <span>{ordenaConfig.direction === 'asc' ? ' 🔼' : ' 🔽'}</span>
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sortedData.map((linha, index) => (
                    <tr key={index}>
                        {Object.values(linha).map((valor, idx) => (
                            <td key={idx}>{valor}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

Tabela.propTypes = {
    dados: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Tabela;