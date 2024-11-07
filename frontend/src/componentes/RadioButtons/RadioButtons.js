import style from './RadioButtons.module.css';

const RadioButtons = ({ titulo, opcoes, name, aoSelecionar }) => {
    return (
        <div className={style.radioButtons}>
            <h5>{titulo}</h5>
            {/* Mapeia as opções recebidas via props para renderizar os radio buttons */}
            {opcoes.map((opcao) => (
                <div key={opcao.id}>
                    <input 
                        type="radio"
                        name={name}
                        value={opcao.value}
                        id={opcao.id}
                        onChange={() => aoSelecionar(opcao.value)} // Chama a função aoSelecionar ao selecionar
                    />
                    <label htmlFor={opcao.id}>{opcao.label}</label> {/* Label descritivo */}
                </div>
            ))}
        </div>
    );
};

export default RadioButtons;
