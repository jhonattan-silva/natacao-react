import React, { useEffect, useState } from 'react';
import styles from './CheckBoxGroup.module.css';

const CheckboxGroup = ({ titulo, opcoes, selecionadas, aoAlterar, useGrid = false }) => {
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
    <div className={styles.checkboxGroupContainer}>
      {titulo && <h3 className={styles.checkboxGroupTitle}>{titulo}</h3>}
      <div className={`${styles.checkboxGrid} ${useGrid ? styles.gridLayout : ''}`}>
        {opcoes.map((opcao) => (
          <div key={opcao.id} className={styles.checkboxItem}>
            <input
              type="checkbox"
              id={`checkbox-${opcao.id}`}
              value={opcao.id} // Valor do checkbox, com o ID da opção
              checked={internalSelected.includes(opcao.id)} // Marca o checkbox se `internalSelected` incluir o ID
              onChange={handleCheckboxChange} // Função chamada ao clicar no checkbox
            />
            <label htmlFor={`checkbox-${opcao.id}`}>{opcao.label}</label> {/* Exibe o rótulo da opção ao lado do checkbox */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
