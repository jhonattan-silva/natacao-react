import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../servicos/UserContext";
import api from "../../servicos/api";
import { somenteNumeros } from "../../servicos/functions";
import style from './Login.module.css';
import useAlerta from '../../hooks/useAlerta';

const Login = () => {
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [campoSenhaFocado, setCampoSenhaFocado] = useState(false);
    const navigate = useNavigate();
    const { atualizarUsuario } = useUser();
    const { mostrar: mostrarAlerta, componente: AlertaComponente } = useAlerta();

    /* Força a renderização do botão quando o campo de senha é preenchido automaticamente
    estava dando conflito com autocomplete dos navegadores */
    useEffect(() => {
        const verificarAutocomplete = setTimeout(() => { // Delay para evitar renderizações excessivas
            const senhaInput = document.getElementById('senha-input'); 
            if (senhaInput && senhaInput.value && !senha) { // se o campo de senha estiver preenchido automaticamente
                setSenha(senhaInput.value); // atualiza o estado da senha
            }
        }, 100);
        
        return () => clearTimeout(verificarAutocomplete);
    }, [senha]);

    const handleCpfChange = (e) => {
        // Remove automaticamente pontos e traços, mantendo apenas números
        const cpfLimpo = somenteNumeros(e.target.value);
        setCpf(cpfLimpo);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const cpfString = cpf.toString();
            const response = await api.post("/auth/login", { cpf: cpfString, senha });
            const { token } = response.data;

            localStorage.setItem("token", token);
            // Salva a versão do app para força relogin em updates
            localStorage.setItem("appVersion", process.env.REACT_APP_VERSION || "1.0.0");
            atualizarUsuario();

            navigate("/admin");
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            if (err.response?.data?.message === 'CPF inválido.') {
                mostrarAlerta("CPF inválido.", 4000);
            } else if (err.response?.data?.message === 'Senha inválida.') {
                mostrarAlerta("Senha inválida.", 4000);
            } else {
                mostrarAlerta("Erro ao fazer login. Tente novamente.", 4000);
            }
        }
    };

    const voltar = () => {
        navigate('/');
    };

    return (
        <div className={style['login-container']}>
            {AlertaComponente}
            <div className={style['login-box']}>
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <label>
                        CPF:
                        <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''}
                            onChange={handleCpfChange}
                            maxLength="14"
                            required
                        />
                    </label>
                    <label>
                        Senha:
                        <div className={style['password-container']}>
                            <input
                                id="senha-input"
                                type={mostrarSenha ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                onFocus={() => setCampoSenhaFocado(true)}
                                onBlur={() => setCampoSenhaFocado(false)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                className={`${style['mostra-senha']} ${senha || campoSenhaFocado ? style['visible'] : ''}`}
                                tabIndex="-1"
                                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {mostrarSenha ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                    </label>
                    <button type="submit" className={style['login-button']}>Entrar</button>
                </form>
                <button onClick={voltar} className={style['voltar-button']}>Voltar</button>
            </div>
        </div>
    );
};

export default Login;
