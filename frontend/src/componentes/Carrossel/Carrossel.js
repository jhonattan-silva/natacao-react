import style from './Carrossel.module.css';

const piscina = ['imagens/noticias/piscina.jpg'];

const Carrossel = () => {
    return (
        <div className={style.carrossel}>
            <img src={piscina} alt='Imagem'></img>
        </div>
    )
}

export default Carrossel;