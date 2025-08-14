import React from 'react';
import styles from './Busca.module.css';

/*
  Componente de Busca
  Permite que o usuário busque por itens em uma lista.
  O componente recebe três props: valor, aoAlterar e placeholder.
  valor: O valor atual da busca.
  aoAlterar: Função chamada quando o valor da busca é alterado.
  placeholder: Texto exibido quando não há valor de busca.
*/

const Busca = ({ valor, aoAlterar, placeholder }) => (
  <div className={styles.buscaContainer}>
    <input
      type="text"
      value={valor}
      onChange={e => aoAlterar(e.target.value)}
      placeholder={placeholder || "Buscar..."}
      className={styles.buscaInput}
    />
  </div>
);

export default Busca;
