import React from 'react';
import styles from '../../pages/Noticias/Noticias.module.css';

const ModalImagem = ({ imagem, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <img src={imagem} alt="Modal" />
      </div>
    </div>
  );
};

export default ModalImagem;
