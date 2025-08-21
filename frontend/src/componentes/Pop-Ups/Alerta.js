import React from 'react';
import styles from './Alerta.module.css';

const Alerta = ({ mensagem, onClose, confirmar, onConfirm }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.alerta}>
        <p className={styles.mensagem}>{mensagem}</p>
        <div className={styles.botoes}>
          {confirmar ? (
            <>
              <button onClick={onConfirm} className={`${styles.botao} ${styles.botaoConfirmar}`}>
                Confirmar
              </button>
              <button onClick={onClose} className={`${styles.botao} ${styles.botaoCancelar}`}>
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={onClose} className={`${styles.botao} ${styles.botaoFechar}`}>
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerta;
