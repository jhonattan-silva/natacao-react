import React from 'react';
import styles from './AvisoBarra.module.css';

const AvisoBarra = ({ mensagem }) => {
    if (!mensagem) {
        return null;
    }

    return (
        <div className={styles.barraAviso}>
            {mensagem}
        </div>
    );
};

export default AvisoBarra;
