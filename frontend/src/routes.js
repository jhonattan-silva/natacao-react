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

const AppRoutes = () => {
    return (
        <BrowserRouter> {/* Avisa que terão rotas aqui dentro */}
            <Routes> {/* Roteador, será o responsavel pelas trocas de rotas */}
                <Route path="/" element={<Inicio />}></Route> {/* Avisa o caminho inicial onde tem meu componente Inicio */}
                <Route path="/admin" element={<Admin/>}></Route>
                <Route path="/balizamento" element={<Balizamento />}></Route> {/*Caminho para balizamento*/}
                <Route path="/equipes" element={<Equipes />}/> 
                <Route path="/etapas" element={<Etapas />}/>
                <Route path="/usuarios" element={<Usuarios />}/>
                <Route path="/nadadores" element={<Nadadores />}/>
                <Route path="/inscricao" element={<Inscricao />}/>
                <Route path="/rankings" element={<Rankings />}/>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes