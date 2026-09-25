import React, { useState, useEffect } from 'react';
import { getPedidos, actualizarEstadoPedido } from '../services/pedidosService';

const SUB_TAB_ESTADOS = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'CREADO', label: 'Creados' },
    { id: 'ACEPTADO', label: 'Aceptados' },
    { id: 'EN_PREPARACION', label: 'En Preparación' },
    { id: 'DESPACHADO', label: 'Despachados' },
    { id: 'ENTREGADO', label: 'Entregados' },
    { id: 'CANCELADO', label: 'Cancelados' }
];

export const OperadorDashboard = () => {
    const [pedidos, setPedidos] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            setCargando(true);
            const data = await getPedidos();
            setPedidos(data);
        } catch (err) {
            console.error("Error al cargar cola operativa:", err);
        } finally {
            setCargando(false);
        }
    };

    const handleCambiarEstado = async (id, nuevoEstado) => {
        try {
            await actualizarEstadoPedido(id, nuevoEstado);
            await cargarPedidos();
        } catch (err) {
            const msj = err.response?.data || err.message;
            alert(`Error operativo: ${msj}`);
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'CREADO': return '#dc3545';       // Rojo
            case 'ACEPTADO': return '#0d6efd';     // Azul
            case 'EN_PREPARACION': return '#d97706';// Naranja
            case 'DESPACHADO': return '#0284c7';   // Celeste
            case 'ENTREGADO': return '#198754';    // Verde
            case 'CANCELADO': return '#8a92a6';    // Gris
            default: return '#333';
        }
    };

    const obtenerSiguientesEstados = (estadoActual) => {
        switch (estadoActual) {
            case 'CREADO': return ['ACEPTADO', 'CANCELADO'];
            case 'ACEPTADO': return ['EN_PREPARACION', 'CANCELADO'];
            case 'EN_PREPARACION': return ['DESPACHADO', 'CANCELADO'];
            case 'DESPACHADO': return ['ENTREGADO', 'CANCELADO'];
            default: return [];
        }
    };

    const pedidosFiltrados = filtroEstado === 'TODOS'
        ? pedidos
        : pedidos.filter(p => p.estado === filtroEstado);

    // Contadores Operativos (Métricas de Logística)
    const pendAceptar = pedidos.filter(p => p.estado === 'CREADO').length;
    const enPreparacion = pedidos.filter(p => p.estado === 'ACEPTADO' || p.estado === 'EN_PREPARACION').length;
    const enCamino = pedidos.filter(p => p.estado === 'DESPACHADO').length;
    const entregados = pedidos.filter(p => p.estado === 'ENTREGADO').length;

    return (
        <div style={{ padding: '40px 60px', backgroundColor: '#fafbfc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Cabecera Operativa */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                        Panel de Operaciones y Logística
                    </h1>
                    <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                        Control de preparación, empaque y despacho de pedidos
                    </p>
                </div>
            </div>

            {/* Tarjetas de Métricas Operativas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '35px' }}>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>POR ACEPTAR</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#dc2626', margin: '8px 0 0' }}>
                        {pendAceptar}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>EN PREPARACIÓN</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#d97706', margin: '8px 0 0' }}>
                        {enPreparacion}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>EN CAMINO</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', margin: '8px 0 0' }}>
                        {enCamino}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>ENTREGADOS</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', margin: '8px 0 0' }}>
                        {entregados}
                    </h2>
                </div>
            </div>

            {/* Card Principal Contenedora */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0' }}>
                    Control de Pedidos y Estado de Despacho
                </h3>

                {/* Sub-pestañas de Estado con Línea Inferior */}
                <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #f1f5f9', marginBottom: '25px', flexWrap: 'wrap' }}>
                    {SUB_TAB_ESTADOS.map(subTab => {
                        const activo = filtroEstado === subTab.id;
                        return (
                            <button
                                key={subTab.id}
                                onClick={() => setFiltroEstado(subTab.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    paddingBottom: '10px',
                                    fontSize: '0.9rem',
                                    fontWeight: activo ? '700' : '600',
                                    color: activo ? '#dc2626' : '#8a92a6',
                                    borderBottom: activo ? '2px solid #dc2626' : '2px solid transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                {subTab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tabla de Pedidos Operativa */}
                {cargando ? (
                    <p style={{ color: '#8a92a6' }}>Cargando cola operativa...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ID / CLIENTE</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>TOTAL</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ESTADO ACTUAL</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px', textAlign: 'right' }}>CAMBIAR ESTADO</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pedidosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#8a92a6' }}>
                                    No hay pedidos registrados en este estado.
                                </td>
                            </tr>
                        ) : (
                            pedidosFiltrados.map(pedido => {
                                const opciones = obtenerSiguientesEstados(pedido.estado);
                                return (
                                    <tr key={pedido.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                                                Pedido #{pedido.id}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#8a92a6', marginTop: '2px' }}>
                                                Cliente ID: {pedido.clienteId || 'Cliente registrado'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                                            ${(pedido.total || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td style={{ padding: '16px 8px', fontWeight: '800', fontSize: '0.85rem', color: getEstadoColor(pedido.estado) }}>
                                            {pedido.estado}
                                        </td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                            {opciones.length > 0 ? (
                                                <select
                                                    value={pedido.estado}
                                                    onChange={(e) => handleCambiarEstado(pedido.id, e.target.value)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '20px',
                                                        border: '1px solid #e2e8f0',
                                                        backgroundColor: '#f8fafc',
                                                        fontWeight: '700',
                                                        fontSize: '0.8rem',
                                                        color: getEstadoColor(pedido.estado),
                                                        cursor: 'pointer',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    <option value={pedido.estado} disabled>
                                                        {pedido.estado}
                                                    </option>
                                                    {opciones.map(sig => (
                                                        <option key={sig} value={sig} style={{ color: '#0f172a' }}>
                                                            {sig}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    backgroundColor: '#f1f5f9',
                                                    color: getEstadoColor(pedido.estado),
                                                    fontWeight: '700',
                                                    fontSize: '0.8rem'
                                                }}>
                                                        {pedido.estado}
                                                    </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};