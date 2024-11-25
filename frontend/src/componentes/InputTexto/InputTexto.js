import style from './InputTexto.module.css';

const InputTexto = (props) => {
    const aoDigitar = (evento) => {
        props.aoAlterar(evento.target.value);
    };

    return (
        <div className={style.campoTexto}>
            <label htmlFor={props.id}>{props.label}</label>
            <input
                id={props.id}
                type={props.tipo || 'text'} // Define o tipo como "text" por padrão
                value={props.valor}
                onChange={aoDigitar}
                required={props.obrigatorio}
                placeholder={props.placeholder}
            />
        </div>
    );
};

export default InputTexto;
