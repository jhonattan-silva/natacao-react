import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";
import {jwtDecode} from "jwt-decode";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const atualizarUsuario = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = jwtDecode(token);
            let perfil = { ...decoded };
            try {
                const resp = await api.get(`/usuarios/buscarUsuario/${decoded.id}`);
                const { nome, email, equipeId, equipeAtiva } = resp.data;
                perfil = { ...decoded, nome, email, equipeId: equipeId ? [equipeId] : [], equipeAtiva };
            } catch {
                // falha ao buscar perfil, continua apenas com decoded
            }
            setUser(perfil);
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        atualizarUsuario();
    }, []);

    return (
        <UserContext.Provider value={{ user, atualizarUsuario, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
