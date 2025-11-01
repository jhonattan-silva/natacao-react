import React from 'react';
import styles from './Alerta.module.css';

const Alerta = ({ mensagem, onClose, confirmar, onConfirm }) => {
  // 🔹 Converte \n em <br> para quebrar linhas no HTML
  const mensagemFormatada = mensagem.split('\n').map((linha, index) => (
    <span key={index}>
      {linha}
      {index < mensagem.split('\n').length - 1 && <br />}
    </span>
  ));

  return (
    <div className={styles.overlay}>
      <div className={styles.alerta}>
        <p>{mensagemFormatada}</p>
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
