import { Link } from 'react-router-dom';
import style from './CabecalhoAdmin.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';

const logo = ['./imagens/logo.jpg'];

const CabecalhoAdmin = () => {
    return (
        <header className={style.cabecalho}>
            <Link to="./">
                <img src={logo} alt='LPN logo' className={style.logo}></img>
            </Link>
            <nav>
                <CabecalhoLink url='../../'> Home </CabecalhoLink>
                <CabecalhoLink url='../Nadadores'> Nadadores </CabecalhoLink>
                <CabecalhoLink url='../Inscricao'> Inscrição </CabecalhoLink>
                <CabecalhoLink url='../Etapas'> Etapas </CabecalhoLink>
                <CabecalhoLink url='../ResultadosEntrada'> Inserir Resultados </CabecalhoLink>
                <CabecalhoLink url='../Classificacao'> Classificação </CabecalhoLink>
                <CabecalhoLink url='../balizamento'> Balizamento </CabecalhoLink>
                <CabecalhoLink url='../Admin'> ADMIN </CabecalhoLink>
            </nav>
        </header>
    )
}

export default CabecalhoAdmin