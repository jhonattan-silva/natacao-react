import React from 'react';
import PropTypes from 'prop-types';
import style from './BotaoTabela.module.css';

/*
*
* Botão padronizado para opções de tabelas
*
* @param {string} tipo - Função do botão (editar, excluir, abrirInscricao, fecharInscricao, gerarPontuacao)
* @param {function} onClick - Função a ser executada ao clicar no botão
* @param {object} labels - Labels dos botões
*
*/
const BotaoTabela = ({ tipo, onClick, labels }) => {
  const getButtonLabel = (tipo) => {
    return labels[tipo] || '';
  };

  return (
    <button 
      className={`${style.botaoTabela} ${style[`btn${tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : ''}`]}`} 
      onClick={onClick}
    >
      {getButtonLabel(tipo)}
    </button>
  );
};

BotaoTabela.propTypes = {
  tipo: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  labels: PropTypes.objectOf(PropTypes.string).isRequired,
};

BotaoTabela.defaultProps = {
  labels: {
    editar: 'Editar',
    excluir: 'Excluir',
    abrirInscricao: 'Abrir Inscrição',
    fecharInscricao: 'Fechar Inscrição',
    gerarPontuacao: 'Gerar Pontuação'
  }
};

export default BotaoTabela;
