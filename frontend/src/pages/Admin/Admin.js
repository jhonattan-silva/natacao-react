import Tile from '../../componentes/Tile/Tile';
import style from './Admin.module.css';
import { useNavigate } from 'react-router-dom';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { useState, useEffect } from 'react';
import Dashboard from '../../componentes/Dashboard/Dashboard';

const Admin = () => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState([]);
    const [equipeId, setEquipeId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            setUserProfile(tokenPayload.perfis);
            setEquipeId(tokenPayload.equipeId); // Extrai equipeId do token
        }
    }, []);

    const handleTileClick = (path) => {
        navigate(path);
    };

    return (
        <>
            <CabecalhoAdmin userProfile={userProfile} />
            <section className={style.container}>
                <Tile nomeTile="NADADORES" onClick={() => handleTileClick('/nadadores')} />
                <Tile nomeTile="INSCRIÇÕES" onClick={() => handleTileClick('/inscricao')} />
                {userProfile.includes('admin') && (
                    <>
                        <Tile nomeTile="USUÁRIOS" onClick={() => handleTileClick('/usuarios')} />
                        <Tile nomeTile="EQUIPES" onClick={() => handleTileClick('/equipes')} />
                        <Tile nomeTile="ETAPAS" onClick={() => handleTileClick('/etapas')} />
                        <Tile nomeTile="BALIZAMENTO" onClick={() => handleTileClick('/balizamento')} />
                        <Tile nomeTile="ADICIONAR RESULTADOS" onClick={() => handleTileClick('/resultadosEntrada')} />
                        <Tile nomeTile="NOTÍCIAS" onClick={() => handleTileClick('/noticiasAdmin')} />
                        <Tile nomeTile="RELATÓRIOS" onClick={() => handleTileClick('/relatorios')} />
                    </>
                )}
            </section>
            <Dashboard equipeId={equipeId} /> {/* Passando equipeId para o Dashboard */}
        </>
    );
};

export default Admin;
