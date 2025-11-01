import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../servicos/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import style from './CabecalhoAdmin.module.css';
import CabecalhoLink from '../CabecalhoLink/CabecalhoLink';

const logo = ['./imagens/logo_noBG.png'];

const CabecalhoAdmin = () => {
    const [nome, setNome] = useState('');
    const [equipe, setEquipe] = useState('');
    const [userProfile, setUserProfile] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate(); // Hook de navegação do React Router
    const location = useLocation(); // Get the current location

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

    const handleLinkClick = (url) => {
        if (location.pathname === url) {
            window.location.reload();
        }
    };

    return (
        <header className={style.cabecalho}>
            <div className={style.left}>
                <Link to="/" onClick={() => handleLinkClick('/')}>
                    <img src={logo} alt='LPN logo' className={style.logo} />
                </Link>
            </div>

            <div className={style.center}>
                <nav className={menuOpen ? style.open : ''}>
                    <span className={style.closeButton} onClick={toggleMenu}>&times;</span>
                    <CabecalhoLink url='../Nadadores' onClick={() => { handleLinkClick('../Nadadores'); setMenuOpen(false); }}>Nadadores</CabecalhoLink>
                    <CabecalhoLink url='../Inscricao' onClick={() => { handleLinkClick('../Inscricao'); setMenuOpen(false); }}>Inscrição</CabecalhoLink>
                    {userProfile.includes('admin') && (
                        <>
                            <CabecalhoLink url='../Etapas' onClick={() => { handleLinkClick('../Etapas'); setMenuOpen(false); }}>Etapas</CabecalhoLink>
                            <CabecalhoLink url='../Usuarios' onClick={() => { handleLinkClick('../Usuarios'); setMenuOpen(false); }}>Usuários</CabecalhoLink>
                        </>
                    )}
                    <CabecalhoLink url='../Admin' onClick={() => { handleLinkClick('../Admin'); setMenuOpen(false); }}>ADMIN</CabecalhoLink>
                    {/* Usuário/equipe/sair dentro do sanduíche no mobile */}
                    {menuOpen && (
                        <div className={style.mobileUserInfo}>
                            <div className={style.dadosUsuario}>
                                {nome && <p>{nome}</p>}
                                {equipe && <p>{equipe}</p>}
                            </div>
                            <button onClick={handleLogout} className={style.logoutButton}>Sair</button>
                        </div>
                    )}
                </nav>
            </div>

            {/* Usuário/equipe/sair fora do sanduíche no desktop */}
            <div className={style.userInfo}>
                <div className={style.dadosUsuario}>
                    {nome && <p>{nome}</p>}
                    {equipe && <p>{equipe}</p>}
                </div>
                <button onClick={handleLogout} className={style.logoutButton}>Sair</button>
            </div>

            {/* 🔹 Menu hambúrguer só para mobile */}
            <div className={style.right}>
                <span className={style.menuIcon} onClick={toggleMenu}>&#9776;</span>
            </div>
        </header>
    )
}

export default CabecalhoAdmin;