import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../servicos/api";

const Login = () => {
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/auth/login", { cpf, senha });
            const { token } = response.data;

            // Armazena o token no localStorage
            localStorage.setItem("token", token);

            // Redireciona para a página inicial protegida
            navigate("/admin");
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            setError("CPF ou senha inválidos.");
        }
    };

    return (
        <div>
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
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
};

export default Login;
