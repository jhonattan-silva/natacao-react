import React from 'react';
import style from './Card.module.css';


/*
    Componente Card
    Props:
        cidade: string
        data: string
        horario: string
        balizamento: string
        resultado: string
*/
const Card = ({ nome, cidade, data, horario, endereco, balizamento, resultado }) => {
    return (
        <div className={style.card}>
            <h3>{nome}</h3>
            <p>{cidade}</p>
            <p>{data}</p>
            <p>{horario}</p>
            <p>{endereco}</p>
            <a href={balizamento} target='_blank'>Ver Balizamento</a>
            <a href={resultado} target='_blank'>Resultados</a>
        </div>
    );
}

export default Card;