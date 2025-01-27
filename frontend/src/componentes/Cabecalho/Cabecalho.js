import { Link } from 'react-router-dom';
import style from './Cabecalho.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';
import { useState } from 'react';

const logo = ['./imagens/logo_noBG.png'];

const Cabecalho = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className={style.cabecalho}>
            <Link to="./">
                <img src={logo} alt='LPN logo' className={style.logo}></img>
            </Link>
            {!menuOpen && <span className={style.menuIcon} onClick={toggleMenu}>&#9776;</span>}
            {menuOpen && <span className={style.closeButton} onClick={toggleMenu}>&times;</span>}
            <nav className={menuOpen ? style.open : ''}>
                <CabecalhoLink url='./Noticias'> Noticias </CabecalhoLink>
                <CabecalhoLink url='./Etapas'> Etapas </CabecalhoLink>
                <CabecalhoLink url='./Resultados'> Resultados </CabecalhoLink>
                <CabecalhoLink url='./Classificacao'> Classificação </CabecalhoLink>
                <CabecalhoLink url='./balizamento'> Balizamento </CabecalhoLink>
                <CabecalhoLink url='./rankings'>Rankings</CabecalhoLink>
                <CabecalhoLink url='./Admin' className={style.adminLink}> Acesso Restrito </CabecalhoLink>
            </nav>
        </header>
    )
}

export default Cabecalho;