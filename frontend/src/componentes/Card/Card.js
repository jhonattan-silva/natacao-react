import style from './Card.module.css';

const Card = ({cidade, data, balizamento, resultado}) => {
    return (
        <div className={style.card}> 
            <h3>{cidade}</h3>
            <p>{data}</p>
            <a href={balizamento} target='_blank'>Ver Balizamento</a>
            <a href={resultado} target='_blank'>Resultados</a>
        </div>
    )
}

export default Card;