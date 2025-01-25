import axios from 'axios';

const API_BASE_URL = 'https://www.ligapaulistadenatacao.com.br:5000/api';
// Cria uma instância do Axios com configuração base
const api = axios.create({
//  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api', // Base URL
  baseURL: API_BASE_URL, // Base URL produção
  timeout: 20000, // Tempo limite de 20 segundos
});

console.log('API Base URL:', api.defaults.baseURL); // Verifica se a URL base está configurada corretamente

// Adiciona um interceptor para incluir o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Busca o token do localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Adiciona o token no cabeçalho Authorization
    }
    return config; // Retorna a configuração alterada
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
