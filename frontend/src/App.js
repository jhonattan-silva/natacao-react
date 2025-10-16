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
import Resultados from "./pages/Resultados/Resultados";
import ProtecaoRota from "./componentes/ProtecaoRota";
import Login from "./pages/Login/Login"; // Página de login para autenticação
import Balizamentos from "./pages/Balizamentos/Balizamentos";
import BalizamentosAjuste from "./pages/BalizamentosAjuste/BalizamentosAjuste"; // Página de ajuste de balizamentos
import Noticias from "./pages/Noticias/Noticias"; 
import NoticiasAdmin from "./pages/NoticiasAdmin/NoticiasAdmin"; // Página de administração de notícias
import Records from "./pages/Records/Records"; // Página de records
import Historico from "./pages/Historico/Historico"; // Página de histórico de competições


const App = () => {
    return (
        <BrowserRouter> {/* Avisa que terão rotas aqui dentro */}
            <Routes> {/* Roteador, será o responsavel pelas trocas de rotas */}
                {/* Rotas públicas */}
                <Route path="/" element={<Inicio />}/> {/* Avisa o caminho inicial onde tem meu componente Inicio */}
                <Route path="/login" element={<Login />} />
                <Route path="/resultados" element={<Resultados />} />
                <Route path="/resultados/:eventoId" element={<Resultados />} /> {/* alterado de :provaId para :eventoId */}
                <Route path="/rankings" element={<Rankings />}/>
                <Route path="/balizamentos" element={<Balizamentos />}/>
                <Route path="/balizamentos/:eventoId" element={<Balizamentos />} /> {/* alterado de :provaId para :eventoId */}
                <Route path="/noticias" element={<Noticias />} />
                <Route path="/noticias/:year/:slug" element={<Noticias />} /> {/* Nova rota para detalhe da notícia com ano e slug */}
                <Route path="/noticias/:id" element={<Noticias />} /> {/* Rota para detalhes de uma notícia específica */}
                <Route path="/records" element={<Records />} /> {/* Página de records */}
                <Route path="/historico" element={<Historico />} /> {/* Página de histórico de competições */}

                {/* Rotas protegidas */}
                <Route
                    path="/admin"
                    element={
                        <ProtecaoRota requiredRoles={['admin', 'treinador', 'gerencial']}> {/* Protege a rota, só pode acessar se tiver perfil de admin */}
                            <Admin />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/balizamento"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <Balizamento />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/balizamentosAjuste"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <BalizamentosAjuste />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/equipes"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <Equipes />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/etapas"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <Etapas />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/usuarios"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
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
                    path="/resultadosEntrada"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <ResultadosEntrada />
                        </ProtecaoRota>
                    }
                />
                <Route
                    path="/noticiasAdmin"
                    element={
                        <ProtecaoRota requiredRoles={['admin']}>
                            <NoticiasAdmin />
                        </ProtecaoRota>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;