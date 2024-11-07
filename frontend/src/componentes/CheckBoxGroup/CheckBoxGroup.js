import React, { useEffect, useState } from 'react';

const CheckboxGroup = ({ titulo, opcoes, selecionadas, aoAlterar }) => {
  // Estado interno para refletir as opções selecionadas, sincronizado com `selecionadas` prop
  const [internalSelected, setInternalSelected] = useState(selecionadas);

  // Sincroniza o estado interno com `selecionadas` sempre que `selecionadas` prop mudar
  useEffect(() => {
    setInternalSelected(selecionadas);
  }, [selecionadas]);

  // Função chamada ao alterar o estado de um checkbox individual
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target; // Extrai o valor e se está marcado do evento
    aoAlterar(value, checked); // Chama a função `aoAlterar` passada por prop para atualizar o estado
  };

  return (
    <div>
      <h3>{titulo}</h3> {/* Título do grupo de checkboxes */}
      {opcoes.map((opcao) => (
        <div key={opcao.id}>
          <input
            type="checkbox"
            value={opcao.id} // Valor do checkbox, com o ID da opção
            checked={internalSelected.includes(opcao.id)} // Marca o checkbox se `internalSelected` incluir o ID
            onChange={handleCheckboxChange} // Função chamada ao clicar no checkbox
          />
          <label>{opcao.label}</label> {/* Exibe o rótulo da opção ao lado do checkbox */}
        </div>
      ))}
    </div>
  );
};

export default CheckboxGroup;
