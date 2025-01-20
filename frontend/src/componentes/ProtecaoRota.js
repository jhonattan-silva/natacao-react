import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../servicos/UserContext";

const ProtecaoRota = ({ children, requiredRoles }) => {
    const token = localStorage.getItem('token'); // Recupera o token JWT do localStorage

    if (!token) {
        // Se o token não existe, redireciona para login
        return <Navigate to="/login" replace />;
    }

    let user;
    try {
        // Decodifica o payload do token JWT para obter os perfis do usuário
        const payload = JSON.parse(atob(token.split('.')[1]));
        user = { ...payload }; // Garante que o payload seja tratado como um objeto `user`
    } catch (error) {
        console.error('Erro ao decodificar o token:', error);
        return <Navigate to="/login" replace />;
    }

    // Verifica se a rota exige perfis e se o usuário possui os perfis necessários
    if (requiredRoles && (!user.perfis || !requiredRoles.some(role => user.perfis.includes(role)))) {
        console.warn('Acesso negado: usuário não possui os perfis necessários.');
        return <Navigate to="/login" replace />;
    }

    // Retorna o componente filho se todas as verificações forem satisfeitas
    return children;
};

export default ProtecaoRota;
