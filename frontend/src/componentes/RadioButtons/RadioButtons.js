/* Componente RadioButtons
    * Renderiza um conjunto de radio buttons
    * Recebe as seguintes props:
    * - titulo: string com o título do conjunto de radio buttons
    * - opcoes: array de objetos com as opções de radio buttons
    * - name: string com o nome do conjunto de radio buttons
    * - aoSelecionar: função a ser chamada ao selecionar um radio button
    * - classNameRadioDiv: string com as classes CSS do container do conjunto de radio buttons
    * - classNameRadioItem: string com as classes CSS do item do conjunto de radio buttons
    * - classNameRadioOpcoes: string com as classes CSS do container das opções de radio buttons
    * - valorSelecionado: string com o valor do radio button selecionado
    * Exemplo de uso:
    * <RadioButtons 
    *  titulo="Título do conjunto de radio buttons"
    * opcoes={[
    * { id: 'opcao1', value: 'opcao1', label: 'Opção 1' },
    * { id: 'opcao2', value: 'opcao2', label: 'Opção 2' }
    * ]}
    * name="nomeDoConjunto"
    * aoSelecionar={(valor) => console.log(valor)}
    * classNameRadioDiv="classe1 classe2"
    * classNameRadioItem="classe1 classe2"
    * classNameRadioOpcoes="classe1 classe2"
    * />
*/
const RadioButtons = ({ titulo, opcoes, name, aoSelecionar, classNameRadioDiv, classNameRadioItem, classNameRadioOpcoes, valorSelecionado }) => {
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
                            checked={valorSelecionado === opcao.value} // Marca o radio button selecionado
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
