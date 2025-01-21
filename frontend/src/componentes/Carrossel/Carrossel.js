import style from './Carrossel.module.css';

const piscina = ['imagens/noticias/breve.jpg'];

const Carrossel = () => {
    return (
        <div className={style.carrossel}>
            <img src={piscina} alt='Imagem'></img>
        </div>
    )
}

export default Carrossel;