import React, { useState, useEffect, useMemo } from 'react';
import { getPedidos, actualizarEstadoPedido } from '../services/pedidosService';
import { getProductos, crearProducto } from '../services/catalogoService';
import { CrearPedidoModal } from './CrearPedidoModal';
import { ConfirmModal } from './ConfirmModal';

const SUB_TAB_ESTADOS = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'CREADO', label: 'Creados' },
    { id: 'ACEPTADO', label: 'Aceptados' },
    { id: 'EN_PREPARACION', label: 'En Preparación' },
    { id: 'DESPACHADO', label: 'Despachados' },
    { id: 'ENTREGADO', label: 'Entregados' },
    { id: 'CANCELADO', label: 'Cancelados' }
];

const PRODUCTO_VACIO = {
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    formato: 'DIGITAL' // valor por defecto válido según CHK_FORMAT
};

export const OperadorDashboard = () => {
    const [pedidos, setPedidos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [tabPrincipal, setTabPrincipal] = useState('PEDIDOS'); // 'PEDIDOS' | 'CATALOGO'
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [cargando, setCargando] = useState(true);
    const [cargandoProductos, setCargandoProductos] = useState(true);

    // --- Estado del modal de creación de producto ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [formProducto, setFormProducto] = useState(PRODUCTO_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState(null);

    // --- Estado del modal de creación de pedido ---
    const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);

    // --- Estado del detalle expandible de pedidos ---
    const [pedidoExpandidoId, setPedidoExpandidoId] = useState(null);

    // --- Estado del modal de confirmación (cancelar pedido) ---
    const [confirmacion, setConfirmacion] = useState(null);

    useEffect(() => {
        cargarPedidos();
        cargarProductos();
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

    const cargarProductos = async () => {
        try {
            setCargandoProductos(true);
            const data = await getProductos();
            setProductos(data);
        } catch (err) {
            console.warn("No se pudo conectar con ms-catalogo para cargar el catálogo:", err);
        } finally {
            setCargandoProductos(false);
        }
    };

    const ejecutarCambioEstado = async (id, nuevoEstado) => {
        try {
            await actualizarEstadoPedido(id, nuevoEstado);
            await cargarPedidos();
        } catch (err) {
            const msj = err.response?.data || err.message;
            alert(`Error operativo: ${msj}`);
        }
    };

    const handleCambiarEstado = (id, nuevoEstado) => {
        // Solo la cancelación pide confirmación; los demás cambios se aplican directo
        if (nuevoEstado === 'CANCELADO') {
            setConfirmacion({
                titulo: '¿Cancelar este pedido?',
                mensaje: `El pedido #${id} quedará cancelado. Esta acción no se puede deshacer.`,
                textoConfirmar: 'Sí, cancelar pedido',
                onConfirm: () => ejecutarCambioEstado(id, nuevoEstado)
            });
            return;
        }
        ejecutarCambioEstado(id, nuevoEstado);
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

    // Mapa id -> producto, para resolver nombres en el detalle de pedidos (O(1) por ítem)
    const productosPorId = useMemo(() => {
        const mapa = {};
        productos.forEach(p => { mapa[p.id] = p; });
        return mapa;
    }, [productos]);

    const obtenerNombreProducto = (productoId) => {
        const producto = productosPorId[productoId];
        return producto?.nombre || `Producto #${productoId}`;
    };

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

    const toggleDetallePedido = (id) => {
        setPedidoExpandidoId(prev => (prev === id ? null : id));
    };

    // --- Handlers del modal de creación de producto ---

    const abrirModalNuevo = () => {
        setFormProducto(PRODUCTO_VACIO);
        setErrorForm(null);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setFormProducto(PRODUCTO_VACIO);
        setErrorForm(null);
    };

    const handleChangeForm = (campo, valor) => {
        setFormProducto(prev => ({ ...prev, [campo]: valor }));
    };

    const handleCrearProducto = async (e) => {
        e.preventDefault();
        setErrorForm(null);

        if (!formProducto.nombre.trim() || formProducto.precio === '' || formProducto.stock === '') {
            setErrorForm('Nombre, precio y stock son obligatorios.');
            return;
        }

        const payload = {
            nombre: formProducto.nombre,
            descripcion: formProducto.descripcion,
            precio: Number(formProducto.precio),
            stock: Number(formProducto.stock),
            formato: formProducto.formato
        };

        try {
            setGuardando(true);
            await crearProducto(payload);
            await cargarProductos();
            cerrarModal();
        } catch (err) {
            const msj = err.response?.data?.message || err.response?.data || err.message;
            setErrorForm(`Error al guardar: ${msj}`);
        } finally {
            setGuardando(false);
        }
    };

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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setModalPedidoAbierto(true)}
                        style={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}>
                        Crear Pedido
                    </button>
                    <button
                        onClick={abrirModalNuevo}
                        style={{
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}>
                        + Nuevo Producto
                    </button>
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

            {/* Navbar Superior de Pestañas Principales */}
            <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <button
                    onClick={() => setTabPrincipal('PEDIDOS')}
                    style={{
                        background: 'none', border: 'none', paddingBottom: '12px', fontSize: '1rem', fontWeight: '700',
                        color: tabPrincipal === 'PEDIDOS' ? '#dc2626' : '#8a92a6',
                        borderBottom: tabPrincipal === 'PEDIDOS' ? '3px solid #dc2626' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Gestión de Pedidos
                </button>
                <button
                    onClick={() => setTabPrincipal('CATALOGO')}
                    style={{
                        background: 'none', border: 'none', paddingBottom: '12px', fontSize: '1rem', fontWeight: '700',
                        color: tabPrincipal === 'CATALOGO' ? '#dc2626' : '#8a92a6',
                        borderBottom: tabPrincipal === 'CATALOGO' ? '3px solid #dc2626' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Catálogo de Productos
                </button>
            </div>

            {/* VISTA 1: GESTIÓN DE PEDIDOS */}
            {tabPrincipal === 'PEDIDOS' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0' }}>
                        Control de Pedidos y Estado de Despacho
                    </h3>

                    <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #f1f5f9', marginBottom: '25px', flexWrap: 'wrap' }}>
                        {SUB_TAB_ESTADOS.map(subTab => {
                            const activo = filtroEstado === subTab.id;
                            return (
                                <button
                                    key={subTab.id}
                                    onClick={() => setFiltroEstado(subTab.id)}
                                    style={{
                                        background: 'none', border: 'none', paddingBottom: '10px', fontSize: '0.9rem',
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

                    {cargando ? (
                        <p style={{ color: '#8a92a6' }}>Cargando cola operativa...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ID / CLIENTE</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>TOTAL</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ESTADO ACTUAL</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px', textAlign: 'center' }}>DETALLE</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px', textAlign: 'right' }}>CAMBIAR ESTADO</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pedidosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#8a92a6' }}>
                                        No hay pedidos registrados en este estado.
                                    </td>
                                </tr>
                            ) : (
                                pedidosFiltrados.map(pedido => {
                                    const opciones = obtenerSiguientesEstados(pedido.estado);
                                    const expandido = pedidoExpandidoId === pedido.id;
                                    return (
                                        <React.Fragment key={pedido.id}>
                                            <tr style={{ borderBottom: expandido ? 'none' : '1px solid #f8fafc' }}>
                                                <td style={{ padding: '16px 8px' }}>
                                                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                                                        Pedido #{pedido.id}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#8a92a6', marginTop: '2px' }}>
                                                        Cliente: {pedido.clienteId || 'Cliente registrado'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 8px', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>
                                                    ${(pedido.total || 0).toLocaleString('es-CL')}
                                                </td>
                                                <td style={{ padding: '16px 8px', fontWeight: '800', fontSize: '0.85rem', color: getEstadoColor(pedido.estado) }}>
                                                    {pedido.estado}
                                                </td>
                                                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleDetallePedido(pedido.id)}
                                                        style={{
                                                            border: '1px solid #e2e8f0', backgroundColor: expandido ? '#0f172a' : '#fff',
                                                            color: expandido ? '#fff' : '#475569',
                                                            padding: '6px 14px', borderRadius: '12px', fontWeight: '700',
                                                            fontSize: '0.8rem', cursor: 'pointer'
                                                        }}>
                                                        {expandido ? 'Ocultar' : 'Ver detalle'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                                    {opciones.length > 0 ? (
                                                        <select
                                                            value={pedido.estado}
                                                            onChange={(e) => handleCambiarEstado(pedido.id, e.target.value)}
                                                            style={{
                                                                padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0',
                                                                backgroundColor: '#f8fafc', fontWeight: '700', fontSize: '0.8rem',
                                                                color: getEstadoColor(pedido.estado), cursor: 'pointer', outline: 'none'
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
                                                            padding: '8px 16px', borderRadius: '20px', backgroundColor: '#f1f5f9',
                                                            color: getEstadoColor(pedido.estado), fontWeight: '700', fontSize: '0.8rem'
                                                        }}>
                                                                {pedido.estado}
                                                            </span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Fila expandible con el detalle de ítems del pedido */}
                                            {expandido && (
                                                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td colSpan="5" style={{ padding: '0 8px 20px 8px' }}>
                                                        <div style={{
                                                            backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px 20px'
                                                        }}>
                                                            {pedido.fechaCreacion && (
                                                                <p style={{ fontSize: '0.8rem', color: '#8a92a6', margin: '0 0 10px 0' }}>
                                                                    Creado: {formatearFecha(pedido.fechaCreacion)}
                                                                </p>
                                                            )}
                                                            {pedido.items && pedido.items.length > 0 ? (
                                                                pedido.items.map((item, idx) => (
                                                                    <div key={idx} style={{
                                                                        display: 'flex', justifyContent: 'space-between',
                                                                        fontSize: '0.85rem', color: '#334155', padding: '6px 0',
                                                                        borderBottom: idx < pedido.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                                                                    }}>
                                                                        <span style={{ fontWeight: '600' }}>
                                                                            {item.cantidad}x {obtenerNombreProducto(item.productoId)}
                                                                        </span>
                                                                        <span style={{ fontWeight: '700' }}>
                                                                            ${((item.precioUnitario || 0) * item.cantidad).toLocaleString('es-CL')}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p style={{ fontSize: '0.85rem', color: '#8a92a6', margin: 0 }}>
                                                                    Este pedido no tiene ítems registrados.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* VISTA 2: CATÁLOGO DE PRODUCTOS (solo lectura + crear) */}
            {tabPrincipal === 'CATALOGO' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0' }}>
                        Catálogo de Productos (`ms-catalogo`)
                    </h3>

                    {cargandoProductos ? (
                        <p style={{ color: '#8a92a6' }}>Cargando catálogo...</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ID</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>PRODUCTO</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>PRECIO</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>STOCK DISPONIBLE</th>
                                <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>FORMATO</th>
                            </tr>
                            </thead>
                            <tbody>
                            {productos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#8a92a6' }}>
                                        No hay productos registrados en el catálogo.
                                    </td>
                                </tr>
                            ) : (
                                productos.map(prod => (
                                    <tr key={prod.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '16px 8px', fontWeight: '800', color: '#0f172a' }}>#{prod.id}</td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ fontWeight: '800', color: '#0f172a' }}>{prod.nombre}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#8a92a6' }}>{prod.descripcion}</div>
                                        </td>
                                        <td style={{ padding: '16px 8px', fontWeight: '800', color: '#0f172a' }}>
                                            ${(prod.precio || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                                <span style={{
                                                    fontWeight: '800',
                                                    color: prod.stock < 5 ? '#dc2626' : '#16a34a'
                                                }}>
                                                    {prod.stock} unidades
                                                </span>
                                        </td>
                                        <td style={{ padding: '16px 8px', fontWeight: '700', color: '#475569' }}>
                                            {prod.formato}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* MODAL DE CREACIÓN DE PRODUCTO (solo crear, sin editar/eliminar) */}
            {modalAbierto && (
                <div
                    onClick={cerrarModal}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
                            width: '420px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                            Nuevo Producto
                        </h3>

                        <form onSubmit={handleCrearProducto}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formProducto.nombre}
                                    onChange={(e) => handleChangeForm('nombre', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                    Descripción
                                </label>
                                <textarea
                                    value={formProducto.descripcion}
                                    onChange={(e) => handleChangeForm('descripcion', e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                        Precio
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={formProducto.precio}
                                        onChange={(e) => handleChangeForm('precio', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={formProducto.stock}
                                        onChange={(e) => handleChangeForm('stock', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                    Formato
                                </label>
                                <select
                                    value={formProducto.formato}
                                    onChange={(e) => handleChangeForm('formato', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#fff' }}
                                >
                                    <option value="DIGITAL">Digital</option>
                                    <option value="FISICO">Físico</option>
                                </select>
                            </div>

                            {errorForm && (
                                <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '600', marginBottom: '14px' }}>
                                    {errorForm}
                                </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    style={{
                                        padding: '10px 20px', borderRadius: '20px', border: '1px solid #e2e8f0',
                                        backgroundColor: '#fff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    style={{
                                        padding: '10px 20px', borderRadius: '20px', border: 'none',
                                        backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '0.85rem',
                                        cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1
                                    }}
                                >
                                    {guardando ? 'Guardando...' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CREACIÓN DE PEDIDO */}
            {modalPedidoAbierto && (
                <CrearPedidoModal
                    productos={productos}
                    onClose={() => setModalPedidoAbierto(false)}
                    onCreated={cargarPedidos}
                />
            )}

            {/* MODAL DE CONFIRMACIÓN (cancelar pedido) */}
            {confirmacion && (
                <ConfirmModal
                    titulo={confirmacion.titulo}
                    mensaje={confirmacion.mensaje}
                    textoConfirmar={confirmacion.textoConfirmar}
                    onConfirm={confirmacion.onConfirm}
                    onClose={() => setConfirmacion(null)}
                />
            )}
        </div>
    );
};