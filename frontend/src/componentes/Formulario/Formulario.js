import InputTexto from '../InputTexto/InputTexto';
import style from './Formulario.module.css';

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
                    />
                ))}
            </form>
        </section>
    );
};

export default Formulario;
