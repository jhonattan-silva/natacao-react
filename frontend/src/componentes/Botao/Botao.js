import React from 'react';
import PropTypes from 'prop-types';
import styles from './Botao.module.css';

const Botao = ({ onClick, children, className, ...rest }) => {
  return (
    <button className={`${styles.botao} ${className || ''}`} onClick={onClick} {...rest}>
      {children}
    </button>
  );
};

Botao.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Botao;