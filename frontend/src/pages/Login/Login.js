import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../servicos/api";
import Botao from '../../componentes/Botao/Botao';
import style from './Login.module.css';

const Login = () => {
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Hook de navegação do React Router para encaminhar o usuário para outra página

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const cpfString = cpf.toString(); // Garantir que o CPF está sendo tratado como string
            const response = await api.post("/auth/login", { cpf: cpfString, senha }); // Envia o CPF como string e a senha para a rota de login
            const { token } = response.data; // Extrai o token da resposta

            // Armazena o token no localStorage
            localStorage.setItem("token", token);
            alert("Login realizado com sucesso!");
            // Redireciona para a página de admin
            navigate("/admin");
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            if (err.response && err.response.data.message === 'CPF inválido.') {
                setError("CPF inválido.");
            } else if (err.response && err.response.data.message === 'Senha inválida.') {
                setError("Senha inválida.");
            } else {
                setError("Erro ao fazer login. Tente novamente.");
            }
        }
    };

    const voltar = () => {
        navigate('/'); // Navega para a página inicial
    };

    return (
        <div className={style['login-container']}>
            <div className={style['login-box']}>
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <label>
                        CPF:
                        <input
                            type="number"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Senha:
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </label>
                    {error && <p className={style['error-message']}>{error}</p>}
                    <button type="submit" className={style['login-button']}>Entrar</button>
                </form>
                <button onClick={voltar} className={style['back-button']}>Voltar</button>
            </div>
        </div>
    );
};

export default Login;
