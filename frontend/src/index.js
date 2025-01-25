import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './servicos/UserContext'; // Importando o UserProvider para envolver o App
import { ResultadosProvider } from './servicos/ResultadoContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <UserProvider> {/* UserProvider fica disponivel para tudo */}
      <ResultadosProvider> {/* ResultadosProvider fica disponivel para tudo */}
        <App />
      </ResultadosProvider>
    </UserProvider>
  </React.StrictMode>
);
