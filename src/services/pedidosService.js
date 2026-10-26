import axios from 'axios';
import axiosClient from './axiosClient';

const API_URL = import.meta.env.VITE_API_URL;
const PEDIDOS_URL = `${API_URL}/api/bff/pedidos`;

export const getPedidos = async () => {
    const response = await axiosClient.get(PEDIDOS_URL);
    return response.data;
};

export const actualizarEstadoPedido = async (id, nuevoEstado) => {
    const response = await axiosClient.patch(
        `${PEDIDOS_URL}/${id}/status`,
        null,
        {
            params: { status: nuevoEstado }
        }
    );

    return response.data;
};

export const cancelarPedidoAdmin = async (id) => {
    const response = await axiosClient.patch(
        `${PEDIDOS_URL}/${id}/cancelar-admin`
    );

    return response.data;
};

export const crearPedido = async (pedidoData) => {
    const response = await axiosClient.post(
        PEDIDOS_URL,
        pedidoData
    );

    return response.data;
};

export const getPedidosPorCliente = async (clienteId) => {
    const response = await axiosClient.get(
        `${PEDIDOS_URL}/client/${encodeURIComponent(clienteId)}`
    );

    return response.data;
};

export const getMetricasVentas = async () => {
    const response = await axiosClient.get(
        `${PEDIDOS_URL}/metricas`
    );

    return response.data;
};

// ---- Endpoints públicos (sin login): axios simple, sin token ----

// Compra como invitado: clienteId = correo del comprador.
// Devuelve el pedido con su codigoSeguimiento.
export const crearPedidoInvitado = async (pedidoData) => {
    const response = await axios.post(
        `${PEDIDOS_URL}/invitado`,
        pedidoData
    );

    return response.data;
};

// Seguimiento por código (ej: P360-AB12CD)
export const getPedidoPorCodigo = async (codigo) => {
    const response = await axios.get(
        `${PEDIDOS_URL}/seguimiento/${encodeURIComponent(codigo.trim().toUpperCase())}`
    );

    return response.data;
};