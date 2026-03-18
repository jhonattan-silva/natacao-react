import React from 'react';
import PropTypes from 'prop-types';
import styles from './Botao.module.css';

const Botao = ({ onClick, children, className, classBtn, ...rest }) => {
  const classes = `${styles.botao} ${className || classBtn || ''}`;

  return (
    <button className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
};

Botao.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  classBtn: PropTypes.string
};

export default Botao;