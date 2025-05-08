import style from './InputTexto.module.css';

/**
 * Componente de campo de texto reutilizável.
 *
 * @component
 * @param {Object} props - Propriedades do componente.
 * @param {string} props.id - Identificador único para o input.
 * @param {string} [props.tipo='text'] - Tipo do input (ex: text, email, password).
 * @param {string} props.valor - Valor atual do input.
 * @param {function} props.aoAlterar - Função chamada ao alterar o valor (onChange).
 * @param {boolean} props.obrigatorio - Define se o campo é obrigatório.
 * @param {string} props.placeholder - Texto exibido como dica no campo.
 * @param {string} props.label - Rótulo exibido acima do campo.
 * @param {function} [props.onBlur] - Função chamada ao perder o foco (onBlur).
 * @returns {JSX.Element} Componente de input de texto estilizado.
 */
const InputTexto = (props) => {
    const aoDigitar = (evento) => {
        props.aoAlterar(evento.target.value);
    };

    return (
        <div className={style.campoTexto}>
            <label htmlFor={props.id}>{props.label}</label>
            <input
                id={props.id}
                type={props.tipo || 'text'}
                value={props.valor}
                onChange={aoDigitar}
                onBlur={props.onBlur}
                required={props.obrigatorio}
                placeholder={props.placeholder}
            />
        </div>
    );
};

export default InputTexto;