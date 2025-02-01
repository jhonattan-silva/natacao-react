import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const atualizarUsuario = () => {
        const token = localStorage.getItem("token");
        if (token) {
            const decodedToken = jwtDecode(token);
            console.log("Usuário atualizado:", decodedToken);
            setUser(decodedToken);
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        atualizarUsuario();
    }, []);

    return (
        <UserContext.Provider value={{ user, atualizarUsuario }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
