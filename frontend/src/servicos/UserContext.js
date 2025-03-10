import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Estado de carregamento

    const atualizarUsuario = () => {
        const token = localStorage.getItem("token");
        if (token) {
            const decodedToken = jwtDecode(token);
            setUser(decodedToken);
        } else {
            setUser(null);
        }
        setLoading(false); // Indica que o carregamento terminou
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
