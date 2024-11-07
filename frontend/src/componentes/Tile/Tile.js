import style from './Tile.module.css';

const Tile = ({ nomeTile, onClick }) => {
    return (
        <div className={style.tile} onClick={onClick}>
            <h1 className={style.conteudoTile}>{nomeTile}</h1>
        </div>
    )
}

export default Tile;