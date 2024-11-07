import Tile from '../../componentes/Tile/Tile';
import style from './Admin.module.css';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const navigate = useNavigate(); //hook do React Router que permite controlar a navegação dando acesso ao histórico de navegação do usuário

    const handleTileClick = (path) => {
        navigate(path);
    }

    return (
        <section className={style.container}>
            <Tile nomeTile="EQUIPES" onClick={() => handleTileClick('/equipes')}/>
            <Tile nomeTile="ETAPAS" onClick={() => handleTileClick('/etapas')}/>
            <Tile nomeTile="BALIZAMENTO" onClick={() => handleTileClick('/balizamento')}/>
            <Tile nomeTile="USUÁRIOS" onClick={() => handleTileClick('/usuarios')}/>
            <Tile nomeTile="ADICIONAR RESULTADOS" onClick={() => handleTileClick('/resultados')}/>
        </section>
    )
}

export default Admin;
