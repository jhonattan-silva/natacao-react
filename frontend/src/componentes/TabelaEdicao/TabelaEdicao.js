import React from 'react';
import PropTypes from 'prop-types';
import style from './TabelaEdicao.module.css';

/*******
 * Componente de tabela com opções de edição
 * dados: Array de objetos com os dados a serem exibidos
 * colunasOcultas: Array de strings com os nomes das colunas a serem ocultadas
 * onEdit: Função a ser executada ao clicar no botão de editar
 * onInativar: Função a ser executada ao clicar no botão de inativar
 * onDelete: Função a ser executada ao clicar no botão de excluir
 * funcExtra: Botão extra com função personalizada 
 * renderLinha: Função para aplicar estilos personalizados às linhas da tabela
 */
const TabelaEdicao = ({ dados, colunasOcultas = [], onEdit, onInativar, onDelete, funcExtra, renderLinha }) => {
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
          {(onEdit || onInativar || onDelete || funcExtra) && <th>Ações</th>} {/* Condicional para exibir Ações */}
        </tr>
      </thead>
      <tbody>
        {dados.map((linha, index) => (
          <tr key={index} {...(renderLinha ? renderLinha(linha) : {})}>
            {colunas.map((coluna, idx) => (
              <td key={idx}>{linha[coluna]}</td>
            ))}
            {(onEdit || onInativar || onDelete || funcExtra) && (
              <td>
                {onEdit && <button className={style.btnEditar} onClick={() => onEdit(linha.id)}>Editar</button>}
                {onInativar && <button className={style.btnExcluir} onClick={() => onInativar(linha.id)}>Inativar</button>}
                {onDelete && <button className={style.btnExcluir} onClick={() => onDelete(linha.id)}>Excluir</button>}
                {funcExtra && funcExtra(linha)}
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
  funcExtra: PropTypes.func,
  renderLinha: PropTypes.func,
};

TabelaEdicao.defaultProps = {
  colunasOcultas: [],
  funcExtra: null,
  renderLinha: null,
};

export default TabelaEdicao;
