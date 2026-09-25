import axiosClient from './axiosClient';

const API_URL = import.meta.env.VITE_API_URL;
const CATALOGO_URL = `${API_URL}/api/bff/productos`;

export const getProductos = async () => {
  const response = await axiosClient.get(CATALOGO_URL);
  return response.data;
};

export const crearProducto = async (productoData) => {
  const response = await axiosClient.post(CATALOGO_URL, productoData);
  return response.data;
};

export const actualizarProducto = async (id, productoData) => {
  const response = await axiosClient.put(`${CATALOGO_URL}/${id}`, productoData);
  return response.data;
};

export const eliminarProducto = async (id) => {
  const response = await axiosClient.delete(`${CATALOGO_URL}/${id}`);
  return response.data;
};