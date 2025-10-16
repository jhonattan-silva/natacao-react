import React from 'react';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Botao from '../../componentes/Botao/Botao';
import style from './Historico.module.css';

const Historico = () => {
    return (
        <div className={style.historico}>
            <Cabecalho />
            <main className={style.conteudo}>
                <h1>Histórico de Competições</h1>
                <div className={style.botoes}>
                    <Botao>2023</Botao>
                    <Botao>2024</Botao>
                </div>
            </main>
            <Rodape />
        </div>
    );
};

export default Historico;
