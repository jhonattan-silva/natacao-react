import React from 'react';
import styles from './Alerta.module.css';

const Alerta = ({ mensagem, onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.alerta}>
                <p>{mensagem}</p>
                <button onClick={onClose} className={styles.botaoFechar}>Fechar</button>
            </div>
        </div>
    );
};

export default Alerta;
