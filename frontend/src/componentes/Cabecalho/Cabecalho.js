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
            <div className={style.left}>
                <Link to="/" onClick={() => handleLinkClick('/')}>
                    <img src={logo} alt='LPN logo' className={style.logo}></img>
                </Link>
            </div>
            <div className={style.center}>
                <nav className={`${menuOpen ? style.open : ''}`}>
                    <span className={style.closeButton} onClick={toggleMenu}>&times;</span>
                    <CabecalhoLink url='/Resultados' onClick={() => { handleLinkClick('/Resultados'); setMenuOpen(false); }}>Resultados</CabecalhoLink>
                    <CabecalhoLink url='/Rankings' onClick={() => { handleLinkClick('/Rankings'); setMenuOpen(false); }}>Rankings</CabecalhoLink>
                    <CabecalhoLink url='/Balizamentos' onClick={() => { handleLinkClick('/Balizamentos'); setMenuOpen(false); }}>Balizamentos</CabecalhoLink>
                    <CabecalhoLink url='/admin' onClick={() => { handleLinkClick('/admin'); setMenuOpen(false); }}>Acesso Restrito</CabecalhoLink>
                </nav>
            </div>

            <div className={style.right}>
                {!menuOpen && <span className={style.menuIcon} onClick={toggleMenu}>&#9776;</span>}
            </div>
        </header>
    )
}

export default Cabecalho;