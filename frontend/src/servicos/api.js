import axios from 'axios';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : 'https://www.ligapaulistadenatacao.com.br:5000/api';

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;