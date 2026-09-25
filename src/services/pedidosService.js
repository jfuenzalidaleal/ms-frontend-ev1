import axiosClient from './axiosClient';

const PEDIDOS_URL = 'http://localhost:8081/api/pedidos';

export const getPedidos = async () => {
    const response = await axiosClient.get(PEDIDOS_URL);
    return response.data;
};

// Corregido: usa /status y pasa el estado como query param (?status=...)
export const actualizarEstadoPedido = async (id, nuevoEstado) => {
    const response = await axiosClient.patch(`${PEDIDOS_URL}/${id}/status`, null, {
        params: { status: nuevoEstado }
    });
    return response.data;
};

export const getMetricasVentas = async () => {
    const response = await axiosClient.get(`${PEDIDOS_URL}/metricas`);
    return response.data;
};