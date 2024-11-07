import React from 'react';
import PropTypes from 'prop-types';
import style from './Tabela.module.css';

const Tabela = ({ dados }) => {
    if (!dados || dados.length === 0) {
        return <p>Nenhum dado disponível.</p>;
    }

    return (
        <table className={style.tabela}>
            <thead>
                <tr>
                    {Object.keys(dados[0]).map((coluna) => (
                        <th key={coluna}>{coluna}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {dados.map((linha, index) => (
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
