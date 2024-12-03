import React from "react";
import { Navigate } from "react-router-dom";

const ProtecaoRota = ({ children }) => {
    const token = localStorage.getItem('token'); //recupera o token armazenado localmente
    if (!token) {
        return <Navigate to="/login"  replace/> //redireciona para o login
    }
    return children; //exibe a página desejada
};

export default ProtecaoRota;