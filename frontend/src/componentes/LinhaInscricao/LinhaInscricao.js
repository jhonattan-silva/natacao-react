import React from 'react';
import style from './LinhaInscricao.module.css';

const LinhaInscricao = ({ nadador, provas, selecoes, onCheckboxChange, maxReached }) => (
    <tr>
        <td>{nadador.nome}</td>
        {provas.map(prova => (
            <td key={prova.id}>
                <div className={style.checkboxContainer}>
                    <input
                        type="checkbox"
                        checked={!!selecoes[prova.id]}
                        onChange={(e) => onCheckboxChange(nadador.id, prova.id, e.target.checked)}
                        disabled={maxReached && !selecoes[prova.id]} // Desativa checkboxes adicionais se o limite foi atingido
                    />
                </div>
            </td>
        ))}
    </tr>
);

export default LinhaInscricao;
