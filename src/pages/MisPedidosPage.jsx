import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { getPedidosPorCliente } from '../services/pedidosService';
import { getProductos } from '../services/catalogoService';

export function MisPedidosPage() {
    const { accounts } = useMsal();
    const clienteId = accounts?.[0]?.username;

    const [pedidos, setPedidos] = useState([]);
    const [productosPorId, setProductosPorId] = useState({}); // { [id]: producto }
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clienteId) {
            setCargando(false);
            return;
        }
        cargarMisPedidos();
    }, [clienteId]);

    const cargarMisPedidos = async () => {
        try {
            setCargando(true);
            setError(null);

            // Se piden en paralelo: los pedidos del cliente y el catálogo completo (para resolver nombres)
            const [dataPedidos, dataProductos] = await Promise.all([
                getPedidosPorCliente(clienteId),
                getProductos().catch((err) => {
                    console.warn('No se pudo cargar el catálogo para resolver nombres de productos:', err);
                    return [];
                })
            ]);

            const ordenados = [...dataPedidos].sort((a, b) => {
                if (a.fechaCreacion && b.fechaCreacion) {
                    return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
                }
                return (b.id || 0) - (a.id || 0);
            });

            // Mapa id -> producto, para lookup O(1) al renderizar los items
            const mapaProductos = {};
            (dataProductos || []).forEach((p) => {
                mapaProductos[p.id] = p;
            });

            setPedidos(ordenados);
            setProductosPorId(mapaProductos);
        } catch (err) {
            console.error('Error al cargar mis pedidos:', err);
            setError('No se pudieron cargar tus pedidos. Intenta nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'CREADO': return '#dc3545';
            case 'ACEPTADO': return '#0d6efd';
            case 'EN_PREPARACION': return '#d97706';
            case 'DESPACHADO': return '#0284c7';
            case 'ENTREGADO': return '#198754';
            case 'CANCELADO': return '#8a92a6';
            default: return '#333';
        }
    };

    const getEstadoLabel = (estado) => {
        switch (estado) {
            case 'CREADO': return 'Recibido';
            case 'ACEPTADO': return 'Aceptado';
            case 'EN_PREPARACION': return 'En preparación';
            case 'DESPACHADO': return 'Despachado';
            case 'ENTREGADO': return 'Entregado';
            case 'CANCELADO': return 'Cancelado';
            default: return estado;
        }
    };

    const formatearPrecio = (valor) => `$${Number(valor || 0).toLocaleString('es-CL')}`;

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        try {
            return new Date(fecha).toLocaleString('es-CL', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return fecha;
        }
    };

    // Resuelve el nombre del producto desde el catálogo; si ya no existe (fue eliminado), cae a un texto genérico
    const obtenerNombreProducto = (productoId) => {
        const producto = productosPorId[productoId];
        return producto?.nombre || `Producto #${productoId}`;
    };

    if (!clienteId) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8a92a6' }}>
                No se pudo identificar tu sesión. Vuelve a iniciar sesión e intenta de nuevo.
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 60px', backgroundColor: '#fafbfc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                    Mis Pedidos
                </h1>
                <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                    Historial y estado de tus compras
                </p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                {cargando ? (
                    <p style={{ color: '#8a92a6' }}>Cargando tus pedidos...</p>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                        <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '12px' }}>{error}</p>
                        <button
                            onClick={cargarMisPedidos}
                            style={{
                                padding: '8px 20px', borderRadius: '20px', border: 'none',
                                backgroundColor: '#0f172a', color: '#fff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8a92a6' }}>
                        <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>Aún no tienes pedidos</p>
                        <p style={{ fontSize: '0.85rem' }}>Cuando compres algo desde el catálogo, aparecerá aquí.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pedidos.map((pedido) => (
                            <div
                                key={pedido.id}
                                style={{
                                    border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>
                                            Pedido #{pedido.id}
                                        </div>
                                        {pedido.fechaCreacion && (
                                            <div style={{ fontSize: '0.8rem', color: '#8a92a6', marginTop: '2px' }}>
                                                {formatearFecha(pedido.fechaCreacion)}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{
                                        padding: '8px 16px', borderRadius: '20px', backgroundColor: '#f8fafc',
                                        color: getEstadoColor(pedido.estado), fontWeight: '800', fontSize: '0.8rem'
                                    }}>
                                        {getEstadoLabel(pedido.estado)}
                                    </span>
                                </div>

                                {/* Ítems del pedido, con el nombre resuelto desde el catálogo */}
                                {pedido.items && pedido.items.length > 0 && (
                                    <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '12px', marginBottom: '12px' }}>
                                        {pedido.items.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                fontSize: '0.85rem', color: '#475569', padding: '4px 0'
                                            }}>
                                                <span>{item.cantidad}x {obtenerNombreProducto(item.productoId)}</span>
                                                <span style={{ fontWeight: '700' }}>
                                                    {formatearPrecio(item.precioUnitario * item.cantidad)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderTop: '1px solid #f8fafc', paddingTop: '12px', fontWeight: '800'
                                }}>
                                    <span style={{ color: '#0f172a' }}>Total</span>
                                    <span style={{ color: '#dc2626', fontSize: '1.1rem' }}>
                                        {formatearPrecio(pedido.total)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MisPedidosPage;