import Tile from '../../componentes/Tile/Tile';
import style from './Admin.module.css';
import { useNavigate } from 'react-router-dom';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin'; // Importar o componente CabecalhoAdmin
import { useState, useEffect } from 'react';

const Admin = () => {
    const navigate = useNavigate(); //hook do React Router que permite controlar a navegação dando acesso ao histórico de navegação do usuário
    const [userProfile, setUserProfile] = useState([]);

    useEffect(() => { //useEffect hook para obter o perfil do usuário do token JWT armazenado no localStorage
        const token = localStorage.getItem('token'); // Obter o token do localStorage
        if (token) {
            const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Decodificar o payload do token
            setUserProfile(tokenPayload.perfis); // Obter os perfis do usuário do payload do token
        }
    }, []);

    const handleTileClick = (path) => { //Função para lidar com o clique em um tile, redirecionando para a rota especificada
        navigate(path);
    }

    return (
        <>
            <CabecalhoAdmin userProfile={userProfile} /> {/* Passar os perfis do usuário como prop */}
            <section className={style.container}>
                <Tile nomeTile="NADADORES" onClick={() => handleTileClick('/nadadores')} />
                <Tile nomeTile="INSCRIÇÕES" onClick={() => handleTileClick('/inscricao')} />
                {userProfile.includes('admin') && (
                    <>
                        <Tile nomeTile="EQUIPES" onClick={() => handleTileClick('/equipes')} />
                        <Tile nomeTile="USUÁRIOS" onClick={() => handleTileClick('/usuarios')} />
                        <Tile nomeTile="ADICIONAR RESULTADOS" onClick={() => handleTileClick('/resultados')} />
                        <Tile nomeTile="BALIZAMENTO" onClick={() => handleTileClick('/balizamento')} />
                        <Tile nomeTile="ETAPAS" onClick={() => handleTileClick('/etapas')} />
                    </>
                )}
            </section>
        </>
    )
}

export default Admin;
