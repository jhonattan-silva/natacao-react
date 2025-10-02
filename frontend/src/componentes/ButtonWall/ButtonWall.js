import React from 'react';
import PropTypes from 'prop-types';
import style from './ButtonWall.module.css';

/**
 * Componente ButtonWall
 * Exibe uma parede de botões colados, onde cada botão pode ser clicado para executar uma ação.
 * 
 * @param {Array} itens - Lista de itens a serem exibidos como botões. Cada item deve ser um objeto com `id` e `nome`.
 * @param {Function} onClick - Função chamada ao clicar em um botão. Recebe o `id` do item clicado.
 * @param {String} selecionado - ID do botão atualmente selecionado.
 */
const ButtonWall = ({ itens, onClick, selecionado }) => {
    return (
        <div className={style.wall}>
            {itens.map(item => (
                <button
                    key={item.id}
                    className={`${style.button} ${selecionado === item.id ? style.selecionado : ''}`}
                    onClick={() => onClick(item.id)}
                >
                    {item.nome}
                </button>
            ))}
        </div>
    );
};

ButtonWall.propTypes = {
    itens: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            nome: PropTypes.string.isRequired
        })
    ).isRequired,
    onClick: PropTypes.func.isRequired,
    selecionado: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ButtonWall;