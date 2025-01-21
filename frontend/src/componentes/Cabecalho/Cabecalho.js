import { Link } from 'react-router-dom';
import style from './Cabecalho.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';

const logo = ['./imagens/logo_noBG.png'];

const Cabecalho = () => {
    return (
        <header className={style.cabecalho}>
            <Link to="./">
                <img src={logo} alt='LPN logo' className={style.logo}></img>
            </Link>
            <nav>
                <CabecalhoLink url='./Noticias'> Noticias </CabecalhoLink>
                <CabecalhoLink url='./Etapas'> Etapas </CabecalhoLink>
                <CabecalhoLink url='./Resultados'> Resultados </CabecalhoLink>
                <CabecalhoLink url='./Classificacao'> Classificação </CabecalhoLink>
                <CabecalhoLink url='./balizamento'> Balizamento </CabecalhoLink>
                <CabecalhoLink url='./rankings'>Rankings</CabecalhoLink>
            </nav>
            <CabecalhoLink url='./Admin'> Acesso Restrito </CabecalhoLink>
        </header>
    )
}

export default Cabecalho