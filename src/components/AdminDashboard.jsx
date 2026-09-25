import React, { useState, useEffect } from 'react';
import { getPedidos, actualizarEstadoPedido } from '../services/pedidosService';
import { getProductos, crearProducto, actualizarProducto, eliminarProducto } from '../services/catalogoService';

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
    id: null,
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    formato: 'DIGITAL' // valor por defecto válido según CHK_FORMAT
};

export const AdminDashboard = () => {
    const [pedidos, setPedidos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [tabPrincipal, setTabPrincipal] = useState('RESUMEN');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [cargando, setCargando] = useState(true);

    // --- Estado del modal CRUD de productos ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [formProducto, setFormProducto] = useState(PRODUCTO_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const dataPedidos = await getPedidos();
            setPedidos(dataPedidos);

            try {
                const dataProd = await getProductos();
                setProductos(dataProd);
            } catch (pErr) {
                console.warn("No se pudo conectar con ms-catalogo para cargar inventario:", pErr);
            }

        } catch (err) {
            console.error("Error al cargar datos en Admin:", err);
        } finally {
            setCargando(false);
        }
    };

    const handleCambiarEstado = async (id, nuevoEstado) => {
        try {
            await actualizarEstadoPedido(id, nuevoEstado);
            await cargarDatos();
        } catch (err) {
            const msj = err.response?.data || err.message;
            alert(`Error al actualizar estado: ${msj}`);
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

    const totalIngresos = pedidos
        .filter(p => p.estado !== 'CANCELADO')
        .reduce((sum, p) => sum + (p.total || 0), 0);
    const volumenPedidos = pedidos.length;
    const ticketPromedio = volumenPedidos > 0 ? Math.round(totalIngresos / volumenPedidos) : 0;
    const valorInventario = productos.reduce((sum, p) => sum + ((p.precio || 0) * (p.stock || 0)), 0);

    // --- Handlers del CRUD de productos ---

    const abrirModalNuevo = () => {
        setFormProducto(PRODUCTO_VACIO);
        setModoEdicion(false);
        setErrorForm(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (producto) => {
        setFormProducto({
            id: producto.id,
            nombre: producto.nombre || '',
            descripcion: producto.descripcion || '',
            precio: producto.precio ?? '',
            stock: producto.stock ?? '',
            formato: producto.formato || 'DIGITAL'
        });
        setModoEdicion(true);
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

    const handleGuardarProducto = async (e) => {
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
            if (modoEdicion) {
                await actualizarProducto(formProducto.id, payload);
            } else {
                await crearProducto(payload);
            }
            await cargarDatos();
            cerrarModal();
        } catch (err) {
            const msj = err.response?.data?.message || err.response?.data || err.message;
            setErrorForm(`Error al guardar: ${msj}`);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminarProducto = async (producto) => {
        const confirmar = window.confirm(`¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        try {
            await eliminarProducto(producto.id);
            await cargarDatos();
        } catch (err) {
            const msj = err.response?.data?.message || err.response?.data || err.message;
            alert(`Error al eliminar producto: ${msj}`);
        }
    };

    return (
        <div style={{ padding: '40px 60px', backgroundColor: '#fafbfc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Cabecera Principal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                        Panel de Administración General
                    </h1>
                    <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                        Supervisión ejecutiva, control de pedidos e inventario completo
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
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

            {/* Tarjetas de Métricas Generales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '35px' }}>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>INGRESOS TOTALES</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 0' }}>
                        ${totalIngresos.toLocaleString('es-CL')}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>VOLUMEN PEDIDOS</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#dc2626', margin: '8px 0 0' }}>
                        {volumenPedidos}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>TICKET PROMEDIO</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', margin: '8px 0 0' }}>
                        ${ticketPromedio.toLocaleString('es-CL')}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8a92a6', letterSpacing: '0.5px' }}>VALOR INVENTARIO</span>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', margin: '8px 0 0' }}>
                        ${valorInventario.toLocaleString('es-CL')}
                    </h2>
                </div>
            </div>

            {/* Navbar Superior de Pestañas Principales */}
            <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <button
                    onClick={() => setTabPrincipal('RESUMEN')}
                    style={{
                        background: 'none', border: 'none', paddingBottom: '12px', fontSize: '1rem', fontWeight: '700',
                        color: tabPrincipal === 'RESUMEN' ? '#dc2626' : '#8a92a6',
                        borderBottom: tabPrincipal === 'RESUMEN' ? '3px solid #dc2626' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Resumen Ejecutivo
                </button>
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
                    onClick={() => setTabPrincipal('INVENTARIO')}
                    style={{
                        background: 'none', border: 'none', paddingBottom: '12px', fontSize: '1rem', fontWeight: '700',
                        color: tabPrincipal === 'INVENTARIO' ? '#dc2626' : '#8a92a6',
                        borderBottom: tabPrincipal === 'INVENTARIO' ? '3px solid #dc2626' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Gestión de Inventario (CRUD)
                </button>
            </div>

            {/* VISTA 1: RESUMEN EJECUTIVO */}
            {tabPrincipal === 'RESUMEN' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0' }}>
                        Estado General del Negocio
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div style={{ border: '1px solid #f1f5f9', padding: '20px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#8a92a6', fontSize: '0.85rem' }}>DESGLOSE DE PEDIDOS</h4>
                            <p style={{ margin: '4px 0', fontWeight: '700' }}>Pendientes por procesar: <span style={{ color: '#dc2626' }}>{pedidos.filter(p => p.estado === 'CREADO').length}</span></p>
                            <p style={{ margin: '4px 0', fontWeight: '700' }}>En preparación: <span style={{ color: '#d97706' }}>{pedidos.filter(p => p.estado === 'EN_PREPARACION').length}</span></p>
                            <p style={{ margin: '4px 0', fontWeight: '700' }}>Completados: <span style={{ color: '#16a34a' }}>{pedidos.filter(p => p.estado === 'ENTREGADO').length}</span></p>
                        </div>
                        <div style={{ border: '1px solid #f1f5f9', padding: '20px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#8a92a6', fontSize: '0.85rem' }}>CATÁLOGO DE PRODUCTOS</h4>
                            <p style={{ margin: '4px 0', fontWeight: '700' }}>Total ítems registrados: <span>{productos.length}</span></p>
                            <p style={{ margin: '4px 0', fontWeight: '700' }}>Bajo Stock (&lt; 5 unidades): <span style={{ color: '#dc2626' }}>{productos.filter(p => p.stock < 5).length}</span></p>
                        </div>
                        <div style={{ border: '1px solid #f1f5f9', padding: '20px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#8a92a6', fontSize: '0.85rem' }}>ACTIVIDAD RECIENTE</h4>
                            <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#475569' }}>Último pedido registrado: <strong>#{pedidos[pedidos.length - 1]?.id || 'N/A'}</strong></p>
                            <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#475569' }}>Sincronización con `ms-catalogo`: <span style={{ color: '#16a34a', fontWeight: '700' }}>Activa (8082)</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 2: GESTIÓN DE PEDIDOS */}
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
                        <p style={{ color: '#8a92a6' }}>Cargando información...</p>
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
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* VISTA 3: GESTIÓN DE INVENTARIO (CRUD) */}
            {tabPrincipal === 'INVENTARIO' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            Catálogo de Productos (`ms-catalogo`)
                        </h3>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>ID</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>PRODUCTO</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>PRECIO</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px' }}>STOCK DISPONIBLE</th>
                            <th style={{ padding: '16px 8px', fontSize: '0.75rem', fontWeight: '800', color: '#8a92a6', letterSpacing: '0.5px', textAlign: 'right' }}>ACCIONES</th>
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
                                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => abrirModalEditar(prod)}
                                            style={{
                                                border: '1px solid #e2e8f0', backgroundColor: '#fff', padding: '6px 14px',
                                                borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', marginRight: '8px'
                                            }}>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleEliminarProducto(prod)}
                                            style={{
                                                border: '1px solid #fecaca', backgroundColor: '#fff', color: '#dc2626', padding: '6px 14px',
                                                borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                                            }}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CRUD DE PRODUCTO (crear / editar) */}
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
                            {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>

                        <form onSubmit={handleGuardarProducto}>
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
                                    {guardando ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Crear Producto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};