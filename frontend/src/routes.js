import { BrowserRouter, Route, Routes } from "react-router-dom";
import Inicio from "./pages/Inicio/Inicio";
import Balizamento from "./pages/Balizamento/Balizamento";
import Admin from "./pages/Admin/Admin";
import Equipes from "./pages/Equipes/Equipes";
import Etapas from "./pages/Etapas/Etapas";
import Usuarios from "./pages/Usuarios/Usuarios";
import Nadadores from "./pages/Nadadores/Nadadores";
import Inscricao from "./pages/Inscricao/Inscricao";
import Rankings from "./pages/Rankings/Rankings";
import ResultadosEntrada from "./pages/ResultadosEntrada/ResultadosEntrada";
import ProtecaoRota from "./componentes/ProtecaoRota";
import Login from "./pages/Login/Login"; // Página de login para autenticação


const AppRoutes = () => {
    return (
        <BrowserRouter> {/* Avisa que terão rotas aqui dentro */}
            <Routes> {/* Roteador, será o responsavel pelas trocas de rotas */}
                {/* Rotas públicas */}
                <Route path="/" element={<Inicio />}/> {/* Avisa o caminho inicial onde tem meu componente Inicio */}
                <Route path="/login" element={<Login />} />

                {/* Rotas protegidas */}
                <Route
                    path="/admin"
                    element={
                        <ProtecaoRota>
                            <Admin />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/balizamento"
                    element={
                        <ProtecaoRota>
                            <Balizamento />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/equipes"
                    element={
                        <ProtecaoRota>
                            <Equipes />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/etapas"
                    element={
                        <ProtecaoRota>
                            <Etapas />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/usuarios"
                    element={
                        <ProtecaoRota>
                            <Usuarios />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/nadadores"
                    element={
                        <ProtecaoRota>
                            <Nadadores />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/inscricao"
                    element={
                        <ProtecaoRota>
                            <Inscricao />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/rankings"
                    element={
                        <ProtecaoRota>
                            <Rankings />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/resultadosEntrada"
                    element={
                        <ProtecaoRota>
                            <ResultadosEntrada />
                        </ProtecaoRota>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;