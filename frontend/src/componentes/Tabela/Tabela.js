import React, { useState } from 'react';
import PropTypes from 'prop-types';
import style from './Tabela.module.css';

/****
 * Componente de tabela com opções de ordenação
 * dados: Array de objetos com os dados a serem exibidos
 * colunasOcultas: Array de strings com os nomes das colunas a serem ocultadas
 * textoExibicao: Objeto com os textos de exibição para cada coluna
 */
const Tabela = ({
    dados = [],
    colunasOcultas = [],
    textoExibicao = {},
    columnStyles = {},
    fixedLayout = false,
    className = ''
}) => {
    const [ordenaConfig, setOrdenaConfig] = useState({ key: null, direction: 'asc' });

    // Computa as colunas disponíveis filtrando as ocultas e campos especiais internos
    const colunas = dados && dados.length > 0 
        ? Object.keys(dados[0]).filter(coluna => !colunasOcultas.includes(coluna) && !coluna.startsWith('_'))
        : [];

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
        <div className={style['tabela-container']}>
            <table
                className={`${style.tabela} ${fixedLayout ? style.tabelaFixed : ''} ${className}`}
            >
                <thead>
                    <tr>
                        {colunas.map((coluna) => (
                            <th
                                key={coluna}
                                onClick={() => ordenar(coluna)}
                                style={{ cursor: 'pointer', ...columnStyles[coluna] }}
                            >
                                {textoExibicao[coluna] || coluna}
                                {ordenaConfig.key === coluna && (
                                    <span>{ordenaConfig.direction === 'asc' ? ' 🔼' : ' 🔽'}</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((linha, index) => (
                        <tr key={index} className={linha._rowClassName || ''}>
                            {colunas.map((coluna, idx) => (
                                <td key={idx} style={columnStyles[coluna]}>{linha[coluna]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

Tabela.propTypes = {
    dados: PropTypes.arrayOf(PropTypes.object).isRequired,
    colunasOcultas: PropTypes.arrayOf(PropTypes.string), // Validação para colunasOcultas
    textoExibicao: PropTypes.object, // Objeto com mapeamento: { colunaOriginal: 'Texto Exibido' }
    columnStyles: PropTypes.object, // Objeto com estilos por coluna
    fixedLayout: PropTypes.bool,
    className: PropTypes.string
};

export default Tabela;