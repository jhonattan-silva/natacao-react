const RadioButtons = ({ titulo, opcoes, name, aoSelecionar, classNameRadioDiv, classNameRadioItem, classNameRadioOpcoes }) => {
    return (
        <div className={classNameRadioDiv}>
            <h5>{titulo}</h5>
            {/* Mapeia as opções recebidas via props para renderizar os radio buttons */}
            <div className={classNameRadioOpcoes}>
                {opcoes.map((opcao) => (
                    <div key={opcao.id} className={classNameRadioItem}>
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
        </div>
    );
};

export default RadioButtons;
