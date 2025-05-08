// ./componentes/Formulario/Formulario.jsx
import InputTexto from '../InputTexto/InputTexto';
import style from './Formulario.module.css';

/**
 * Componente de formulário dinâmico.
 *
 * Renderiza múltiplos campos de entrada com base na lista de `inputs` recebida.
 *
 * @component
 * @param {Object} props - Propriedades do componente.
 * @param {Array<Object>} props.inputs - Lista de configurações para os campos do formulário.
 * Cada item deve conter:
 *   @param {string} inputs[].id - Identificador único do campo.
 *   @param {string} inputs[].label - Rótulo do campo.
 *   @param {string} inputs[].placeholder - Placeholder do campo.
 *   @param {string} inputs[].valor - Valor atual do campo.
 *   @param {function} inputs[].aoAlterar - Função chamada ao alterar o valor do campo.
 *   @param {boolean} [inputs[].obrigatorio] - Se o campo é obrigatório.
 *   @param {string} [inputs[].tipo] - Tipo do input (ex: text, email).
 *   @param {function} [inputs[].onBlur] - Função chamada ao perder o foco.
 * @param {function} props.aoSalvar - Função chamada ao submeter o formulário.
 *
 * @returns {JSX.Element} Um formulário renderizado dinamicamente.
 */
const Formulario = ({ inputs, aoSalvar }) => {
    return (
        <section className={style.formulario}>
            <form onSubmit={aoSalvar}>
                {inputs.map((input, index) => (
                    <InputTexto
                        key={index}
                        obrigatorio={input.obrigatorio}
                        id={input.id}
                        tipo={input.tipo}
                        label={input.label}
                        placeholder={input.placeholder}
                        valor={input.valor}
                        aoAlterar={input.aoAlterar}
                        onBlur={input.onBlur}
                    />
                ))}
            </form>
        </section>
    );
};

export default Formulario;
