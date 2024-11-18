import axios from 'axios';

// Configura o Axios com uma baseURL dinâmica
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/rankings',
    timeout: 20000, // 20 segundos
});

export default api;
