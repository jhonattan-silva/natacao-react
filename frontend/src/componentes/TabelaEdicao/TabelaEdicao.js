import React from 'react';
import PropTypes from 'prop-types';
import style from './TabelaEdicao.module.css';

const TabelaEdicao = ({ dados, colunasOcultas = [], onEdit, onInativar, onDelete }) => {
  // Detecta as colunas automaticamente e exclui as especificadas em `colunasOcultas`
  const colunas = dados.length > 0 
    ? Object.keys(dados[0]).filter(coluna => !colunasOcultas.includes(coluna))
    : [];

  if (!dados || dados.length === 0) {
    return <p>Nenhum dado disponível.</p>;
  }

  return (
    <table className={style.tabela}>
      <thead>
        <tr>
          {colunas.map((coluna) => (
            <th key={coluna}>{coluna}</th>
          ))}
          {(onEdit || onInativar || onDelete) && <th>Ações</th>} {/* Condicional para exibir Ações */}
        </tr>
      </thead>
      <tbody>
        {dados.map((linha, index) => (
          <tr key={index}>
            {colunas.map((coluna, idx) => (
              <td key={idx}>{linha[coluna]}</td> 
            ))}
            {(onEdit || onInativar || onDelete) && (
              <td>
                {onEdit && <button onClick={() => onEdit(linha.id)}>Editar</button>}
                {onInativar && <button onClick={() => onInativar(linha.id)}>Inativar</button>}
                {onDelete && <button onClick={() => onDelete(linha.id)}>Excluir</button>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

TabelaEdicao.propTypes = {
  dados: PropTypes.arrayOf(PropTypes.object).isRequired,
  colunasOcultas: PropTypes.arrayOf(PropTypes.string), // Validação de `colunasOcultas`
  onEdit: PropTypes.func,
  onInativar: PropTypes.func,
  onDelete: PropTypes.func,
};

export default TabelaEdicao;
