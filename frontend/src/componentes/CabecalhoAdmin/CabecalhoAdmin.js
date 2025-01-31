import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../servicos/api';
import { Link, useNavigate } from 'react-router-dom';
import style from './CabecalhoAdmin.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';

const logo = ['./imagens/logo_noBG.png'];

const CabecalhoAdmin = () => {
    const [nome, setNome] = useState('');
    const [equipe, setEquipe] = useState('');
    const [userProfile, setUserProfile] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate(); // Hook de navegação do React Router

    useEffect(() => { // Hook de efeito para buscar informações do usuário
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.id;
            const equipeUsuarioId = decodedToken.equipeId[0];
            setUserProfile(decodedToken.perfis); // Obter os perfis do usuário

            // Buscar informações do usuario para o Profile
            const fetchUserInfo = async () => {
                try {
                    const response = await api.get(`/usuarios/buscarUsuario/${userId}`);
                    const { nome, equipeId } = response.data;
                    setNome(nome.split(' ')[0]); // Definir apenas o primeiro nome

                    // Buscar nome da equipe a partir do equipeId para o Profile
                    if (equipeUsuarioId) {                        
                        const equipeResponse = await api.get(`/equipes/${equipeUsuarioId}`);
                        setEquipe(equipeResponse.data.nome);
                    }
                } catch (error) {
                    console.error('Erro ao buscar informações do usuário:', error);
                }
            };

            fetchUserInfo();
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove o token do localStorage
        navigate('/'); // Redireciona para a página de login
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className={style.cabecalho}>
            <Link to="/"> {/* Alterar o link para redirecionar para a home */}
                <img src={logo} alt='LPN logo' className={style.logo}></img>
            </Link>
            <span className={style.menuIcon} onClick={toggleMenu}>&#9776;</span>
            <span className={style.closeButton} onClick={toggleMenu}>&times;</span>
            <nav className={menuOpen ? style.open : ''}>
                <CabecalhoLink url='../../'> Home </CabecalhoLink>
                <CabecalhoLink url='../Nadadores'> Nadadores </CabecalhoLink>
                <CabecalhoLink url='../Inscricao'> Inscrição </CabecalhoLink>
                {userProfile.includes('admin') && (
                    <>
                        <CabecalhoLink url='../Etapas'> Etapas </CabecalhoLink>
                        <CabecalhoLink url='../Usuarios'> Usuários </CabecalhoLink>
                        {/* <CabecalhoLink url='../balizamento'> Balizamento </CabecalhoLink> */}
                        {/* <CabecalhoLink url='../ResultadosEntrada'> Inserir Resultados </CabecalhoLink> */}
                    </>
                )}
                {/* <CabecalhoLink url='../Classificacao'> Classificação </CabecalhoLink> */}
                <CabecalhoLink url='../Admin'> ADMIN </CabecalhoLink>
                <div className={style.userInfo}> 
                    <div className={style.dadosUsuario}> 
                        {nome && <p>{nome}</p>}
                        {equipe && <p>{equipe}</p>}
                    </div>
                    <button onClick={handleLogout} className={style.logoutButton}>Sair</button>
                </div>
            </nav>
        </header>
    )
}

export default CabecalhoAdmin;