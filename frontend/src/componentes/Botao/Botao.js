import style from './Botao.module.css';

const Botao = ({ onClick, children, classBtn }) => {
    return (
        <button className={classBtn} onClick={onClick}>{children}</button>
    )
}

export default Botao;