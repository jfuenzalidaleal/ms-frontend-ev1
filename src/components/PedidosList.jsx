import React, { useEffect, useState } from 'react';
import { getPedidos } from '../services/pedidosService';

export const PedidosList = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            setLoading(true);
            const data = await getPedidos();
            setPedidos(data);
        } catch (err) {
            console.error('Error al obtener historial de pedidos:', err);
            setError('No se pudo cargar el historial de pedidos desde ms-pedidos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center mt-5">📦 Cargando historial de pedidos...</div>;
    }

    if (error) {
        return <div className="alert alert-danger m-4 text-center">{error}</div>;
    }

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-dark">📋 Historial de Pedidos</h2>
                <button className="btn btn-outline-primary btn-sm" onClick={cargarPedidos}>
                    🔄 Actualizar
                </button>
            </div>

            {pedidos.length === 0 ? (
                <div className="alert alert-info text-center">No hay pedidos registrados aún.</div>
            ) : (
                <div className="table-responsive shadow-sm rounded">
                    <table className="table table-hover align-middle mb-0 bg-white">
                        <thead className="table-dark">
                        <tr>
                            <th># Pedido</th>
                            <th>Cliente</th>
                            <th>Detalle de Productos</th>
                            <th>Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pedidos.map((pedido) => (
                            <tr key={pedido.id}>
                                <td className="fw-bold">#{pedido.id}</td>
                                <td>{pedido.emailCliente || `Cliente #${pedido.clienteId}`}</td>
                                <td>
                                    <ul className="list-unstyled mb-0 small">
                                        {(pedido.items || pedido.detalles || []).map((item, idx) => (
                                            <li key={idx}>
                                                • {item.nombreProducto || `Producto #${item.productoId}`} x {item.cantidad} (${Number(item.precioUnitario).toLocaleString('es-CL')})
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="fw-bold text-success">
                                    ${Number(pedido.total).toLocaleString('es-CL')}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};