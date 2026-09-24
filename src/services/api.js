import axios from 'axios';

export const productosApi = axios.create({
    baseURL: 'http://localhost:8082/api/productos',
})

export  const pedidosApi = axios.create({
    baseURL: 'http://localhost:8081/api/pedidos'
})