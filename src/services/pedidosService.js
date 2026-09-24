import axiosClient from "./axiosClient";
const API_URL = 'http://localhost:8081/api/pedidos';

export const crearPedido = async (pedidoData) => {
    const response = await axiosClient.post(API_URL, pedidoData);
    return response.data;
};

export const getPedidos = async () => {
    const response = await axiosClient.get(API_URL);
    return response.data;
};