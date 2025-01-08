import React from 'react';
import style from './Card.module.css';

const Card = ({ cidade, data, horario, balizamento, resultado }) => {
    return (
        <div className={style.card}>
            <h3>{cidade}</h3>
            <p>{data}</p>
            <p>{horario}</p>
            <a href={balizamento} target='_blank'>Ver Balizamento</a>
            <a href={resultado} target='_blank'>Resultados</a>
        </div>
    );
}

export default Card;