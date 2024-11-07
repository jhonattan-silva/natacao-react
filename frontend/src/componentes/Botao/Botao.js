import style from './Botao.module.css';

const Botao = ({ onClick, children }) => {
    return (
        <button className={style.botao} onClick={onClick}>{children}</button>
    )
}

export default Botao;