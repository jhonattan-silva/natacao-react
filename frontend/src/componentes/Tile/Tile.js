import React from 'react';
import style from './Tile.module.css';

const Tile = ({ nomeTile, onClick }) => {
    return (
        <div className={style.tile} onClick={onClick}>
            <h2>{nomeTile}</h2>
        </div>
    );
}

export default Tile;