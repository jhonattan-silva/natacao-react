import React from 'react';
import PropTypes from 'prop-types';
import style from './BotaoTabela.module.css';

const BotaoTabela = ({ tipo, onClick }) => {
  const getButtonLabel = (tipo) => {
    switch (tipo) {
      case 'editar':
        return 'Editar';
      case 'inativar':
        return 'Inativar';
      case 'ativar': // Adicionado caso 'ativar'
        return 'Ativar';
      case 'excluir':
        return 'Excluir';
      default:
        return '';
    }
  };

  return (
    <button 
      className={style[`btn${tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : ''}`]} // Adiciona a classe CSS de acordo com o tipo
      onClick={onClick}
    >
      {getButtonLabel(tipo)}
    </button>
  );
};

BotaoTabela.propTypes = {
  tipo: PropTypes.oneOf(['editar', 'inativar', 'ativar', 'excluir']).isRequired, // Adicionado 'ativar' ao PropTypes
  onClick: PropTypes.func.isRequired,
};

export default BotaoTabela;
