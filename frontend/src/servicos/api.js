import axios from 'axios';

// Corrigido: usa sempre a variável de ambiente
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Cria uma instância do Axios com configuração base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Tempo limite de 20 segundos
});

// Interceptor para incluir o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Busca o token do localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Adiciona o token no cabeçalho Authorization
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para verificar quando o login expirou
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se o erro for 401 (não autorizado), limpa o token e redireciona para o login
      console.log('Token expirado ou inválido. Redirecionando para login...');
      localStorage.removeItem('token');
      
      // Redirecionar apenas se não estiver já na página de login/auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/auth') && currentPath !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;