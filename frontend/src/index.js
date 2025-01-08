import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRoutes from './routes';
import { UserProvider } from './servicos/UserContext'; // Importando o UserProvider para envolver o AppRoutes

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <UserProvider> {/* UserProvider fica disponivel para tudo */}
      <AppRoutes />
    </UserProvider>
  </React.StrictMode>
);
