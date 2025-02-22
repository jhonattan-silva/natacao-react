import { Link } from 'react-router-dom';
import style from './Cabecalho.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';
import { useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation

const logo = '/imagens/logo_noBG.png';

const Cabecalho = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation(); //recupera a localização atual para recarregar a página

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleLinkClick = (url) => {
        if (location.pathname === url) {
            window.location.reload();
        }
    };

    return (
        <header className={style.cabecalho}>
            <Link to="/" onClick={() => handleLinkClick('/')}>
                <img src={logo} alt='LPN logo' className={style.logo}></img>
            </Link>
            {!menuOpen && <span className={style.menuIcon} onClick={toggleMenu}>&#9776;</span>}
            {menuOpen && <span className={style.closeButton} onClick={toggleMenu}>&times;</span>}
            <nav className={menuOpen ? style.open : ''}>
                {/* <CabecalhoLink url='./Noticias' onClick={() => handleLinkClick('./Noticias')}> Noticias </CabecalhoLink> */}
                {/* <CabecalhoLink url='./Etapas' onClick={() => handleLinkClick('./Etapas')}> Etapas </CabecalhoLink> */}
                {/* <CabecalhoLink url='./Resultados' onClick={() => handleLinkClick('./Resultados')}> Resultados </CabecalhoLink> */}
                {/* <CabecalhoLink url='./Classificacao' onClick={() => handleLinkClick('./Classificacao')}> Classificação </CabecalhoLink> */}
                {/* <CabecalhoLink url='./balizamento' onClick={() => handleLinkClick('./balizamento')}> Balizamento </CabecalhoLink> */}
                {/* <CabecalhoLink url='./rankings' onClick={() => handleLinkClick('./rankings')}>Rankings</CabecalhoLink> */}
                <CabecalhoLink url='/admin' className={style.adminLink} onClick={() => handleLinkClick('/admin')}> Acesso Restrito </CabecalhoLink>
            </nav>
        </header>
    )
}

export default Cabecalho;