import React from "react";
import { Navigate } from "react-router-dom";

const ProtecaoRota = ({ children, requiredRoles }) => { // chama o componente filho e os perfis exigidos para acesso
    const token = localStorage.getItem('token'); //recupera o token armazenado localmente

    if (!token) { //se não houver token, usuário não está autenticado
        return <Navigate to="/login" replace /> //redireciona para o login
    }

    let user; //cria a variável user para armazenar o usuário


    try {
        user = JSON.parse(atob(token.split('.')[1])); // Decodifica o payload do token JWT para obter os perfis do usuário
    }catch (error) {
            console.error('Erro ao decodificar o token:', error);
            return <Navigate to="/login" />; // Redireciona para a página de acesso negado se o usuário não tiver permissão
        }
        if (requiredRoles && (!user.perfis || !requiredRoles.some(role => user.perfis.includes(role)))) { //verifica se o usuário tem os perfis necessários para acessar a rota
            return <Navigate to="/login" />; //redireciona para a página de acesso negado se o usuário não tiver permissão
        }
        return children; //retorna o componente filho se o usuário tiver permissão
    };

    export default ProtecaoRota;