import React from 'react';
import style from './Card.module.css';

/*
    Componente Card
    Props:
        cidade: string
        data: string
        horario: string
        balizamento: string
        resultados: string
        onClick: function
*/
const Card = ({ nome, cidade, data, horario, endereco, balizamento, resultados, onClick }) => {
    return (
        <div className={style.card} onClick={onClick}>
            <h3>{nome}</h3>
            <p>{cidade}</p>
            <p>{data}</p>
            <p>{horario}</p>
            {balizamento && <div>{balizamento}</div>}
            {resultados && <div>{resultados}</div>}
            <div className={style.endereco}>
                <p>{endereco}</p>
            </div>
        </div>
    );
}

export default Card;