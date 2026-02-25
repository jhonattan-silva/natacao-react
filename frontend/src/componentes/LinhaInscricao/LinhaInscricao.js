import React from 'react';
import style from './LinhaInscricao.module.css';

const LinhaInscricao = ({ nadador, provas, selecoes, onCheckboxChange, maxReached, bloquearNovas, permitidosConferencia }) => (
    <tr>
        <td>{nadador.nome}</td>
        {provas.map(prova => (
            <td key={prova.id}>
                <div className={style.checkboxContainer}>
                    <input
                        type="checkbox"
                        checked={!!selecoes[prova.id]}
                        onChange={(e) => onCheckboxChange(nadador.id, prova.id, e.target.checked)}
                        disabled={
                            (maxReached && !selecoes[prova.id]) ||
                            (bloquearNovas && !permitidosConferencia?.[prova.id])
                        } // Desativa checkboxes adicionais ou novas em conferência
                    />
                </div>
            </td>
        ))}
    </tr>
);

export default LinhaInscricao;
