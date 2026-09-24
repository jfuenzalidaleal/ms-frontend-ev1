import axiosClient from "./axiosClient";
const API_URL = 'http://localhost:8082/api/catalogo/productos';

export const getProductos = async () => {
  const response = await axiosClient.get(API_URL);
  return response.data;
};