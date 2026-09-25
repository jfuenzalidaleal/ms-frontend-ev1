import axiosClient from './axiosClient';

const CATALOGO_URL = 'http://localhost:8082/api/catalogo/productos';

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