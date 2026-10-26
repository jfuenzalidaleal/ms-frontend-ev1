import React, { useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { getPedidosPorCliente } from '../services/pedidosService';
import { getProductos } from '../services/catalogoService';

const FLUJO = ['CREADO', 'ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

const ESTADOS = {
    CREADO: { label: 'Recibido', color: '#dc3545' },
    ACEPTADO: { label: 'Aceptado', color: '#0d6efd' },
    EN_PREPARACION: { label: 'En preparación', color: '#d97706' },
    DESPACHADO: { label: 'Despachado', color: '#0284c7' },
    ENTREGADO: { label: 'Entregado', color: '#198754' },
    CANCELADO: { label: 'Cancelado', color: '#8a92a6' }
};

const getLabel = (e) => ESTADOS[e]?.label || e;
const getColor = (e) => ESTADOS[e]?.color || '#333';
const formatearPrecio = (v) => `$${Number(v || 0).toLocaleString('es-CL')}`;
const formatearFecha = (f) => {
    if (!f) return '';
    try {
        return new Date(f).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return f; }
};

export function MisPedidosPage() {
    const { accounts } = useMsal();
    const clienteId = accounts?.[0]?.username;

    const [pedidos, setPedidos] = useState([]);
    const [productosPorId, setProductosPorId] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState('TODOS');
    const [expandidoId, setExpandidoId] = useState(null);

    useEffect(() => {
        if (!clienteId) { setCargando(false); return; }
        cargarMisPedidos();
    }, [clienteId]);

    const cargarMisPedidos = async () => {
        try {
            setCargando(true);
            setError(null);
            const [dataPedidos, dataProductos] = await Promise.all([
                getPedidosPorCliente(clienteId),
                getProductos().catch(() => [])
            ]);
            const ordenados = [...dataPedidos].sort((a, b) => {
                if (a.fechaCreacion && b.fechaCreacion) return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
                return (b.id || 0) - (a.id || 0);
            });
            const mapa = {};
            (dataProductos || []).forEach((p) => { mapa[p.id] = p; });
            setPedidos(ordenados);
            setProductosPorId(mapa);
        } catch (err) {
            console.error('Error al cargar mis pedidos:', err);
            setError('No se pudieron cargar tus pedidos. Intenta nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const nombreProducto = (id) => productosPorId[id]?.nombre || `Producto #${id}`;

    const enCurso = pedidos.filter(p => !['ENTREGADO', 'CANCELADO'].includes(p.estado)).length;
    const entregados = pedidos.filter(p => p.estado === 'ENTREGADO').length;
    const totalGastado = pedidos.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + Number(p.total || 0), 0);

    const pedidosFiltrados = useMemo(() => {
        if (filtro === 'TODOS') return pedidos;
        if (filtro === 'EN_CURSO') return pedidos.filter(p => !['ENTREGADO', 'CANCELADO'].includes(p.estado));
        return pedidos.filter(p => p.estado === filtro);
    }, [pedidos, filtro]);

    const filtros = [
        { id: 'TODOS', label: 'Todos' },
        { id: 'EN_CURSO', label: 'En curso' },
        { id: 'ENTREGADO', label: 'Entregados' },
        { id: 'CANCELADO', label: 'Cancelados' }
    ];

    const card = { border: '1px solid #cbd5e1', padding: '20px', borderRadius: '12px', backgroundColor: '#fff' };
    const tituloCard = { margin: '0 0 10px 0', color: '#dc2626', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.03em' };
    const valorCard = { margin: 0, fontWeight: '800', fontSize: '1.6rem', color: '#0f172a' };

    if (!clienteId) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8a92a6' }}>
                No se pudo identificar tu sesión. Vuelve a iniciar sesión e intenta de nuevo.
            </div>
        );
    }

    const Tracker = ({ estado }) => {
        if (estado === 'CANCELADO') {
            return <div style={{ fontSize: '0.8rem', color: '#8a92a6', fontWeight: '700' }}>Este pedido fue cancelado.</div>;
        }
        const actual = FLUJO.indexOf(estado);
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                {FLUJO.map((paso, i) => {
                    const hecho = i <= actual;
                    return (
                        <div key={paso} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: hecho ? getColor(estado) : '#e2e8f0' }} />
                            <div style={{
                                marginTop: '6px', fontSize: '0.68rem', fontWeight: i === actual ? '800' : '600',
                                color: hecho ? '#0f172a' : '#94a3b8'
                            }}>
                                {getLabel(paso)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ padding: '40px 60px', backgroundColor: '#fafbfc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Mis Pedidos</h1>
                <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                    Historial y estado de tus compras
                </p>
            </div>

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={card}>
                    <h4 style={tituloCard}>PEDIDOS REALIZADOS</h4>
                    <p style={valorCard}>{pedidos.length}</p>
                </div>
                <div style={card}>
                    <h4 style={tituloCard}>EN CURSO</h4>
                    <p style={valorCard}>{enCurso}</p>
                </div>
                <div style={card}>
                    <h4 style={tituloCard}>ENTREGADOS</h4>
                    <p style={valorCard}>{entregados}</p>
                </div>
                <div style={card}>
                    <h4 style={tituloCard}>TOTAL COMPRADO</h4>
                    <p style={valorCard}>{formatearPrecio(totalGastado)}</p>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                {/* Filtros */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {filtros.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFiltro(f.id)}
                            style={{
                                padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                fontWeight: '700', fontSize: '0.8rem',
                                backgroundColor: filtro === f.id ? '#0f172a' : '#f1f5f9',
                                color: filtro === f.id ? '#fff' : '#475569'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                    <button
                        onClick={cargarMisPedidos}
                        style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: '20px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}
                    >
                        Actualizar
                    </button>
                </div>

                {cargando ? (
                    <p style={{ color: '#8a92a6' }}>Cargando tus pedidos...</p>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                        <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '12px' }}>{error}</p>
                        <button onClick={cargarMisPedidos} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                            Reintentar
                        </button>
                    </div>
                ) : pedidosFiltrados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8a92a6' }}>
                        <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px' }}>
                            {pedidos.length === 0 ? 'Aún no tienes pedidos' : 'No hay pedidos con este filtro'}
                        </p>
                        {pedidos.length === 0 && <p style={{ fontSize: '0.85rem' }}>Cuando compres algo desde el catálogo, aparecerá aquí.</p>}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', alignItems: 'start' }}>
                        {pedidosFiltrados.map((pedido) => {
                            const abierto = expandidoId === pedido.id;
                            const cantItems = (pedido.items || []).reduce((s, i) => s + (i.cantidad || 0), 0);
                            return (
                                <div key={pedido.id} style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>Pedido #{pedido.id}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#8a92a6', marginTop: '2px' }}>
                                                {pedido.fechaCreacion ? `${formatearFecha(pedido.fechaCreacion)} · ` : ''}{cantItems} {cantItems === 1 ? 'producto' : 'productos'}
                                            </div>
                                        </div>
                                        <span style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#f8fafc', color: getColor(pedido.estado), fontWeight: '800', fontSize: '0.8rem' }}>
                                            {getLabel(pedido.estado)}
                                        </span>
                                    </div>

                                    <Tracker estado={pedido.estado} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '12px' }}>
                                        <button
                                            onClick={() => setExpandidoId(abierto ? null : pedido.id)}
                                            style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                                        >
                                            {abierto ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
                                        </button>
                                        <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '1.1rem' }}>{formatearPrecio(pedido.total)}</span>
                                    </div>

                                    {abierto && (
                                        <div style={{ marginTop: '12px' }}>
                                            {(pedido.items || []).map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.85rem', color: '#475569', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                    <span>{item.cantidad}x {nombreProducto(item.productoId)}</span>
                                                    <span style={{ fontWeight: '700' }}>{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MisPedidosPage;