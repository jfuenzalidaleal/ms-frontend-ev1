import React, { useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { getPedidosPorCliente } from '../services/pedidosService';
import { getProductos } from '../services/catalogoService';
import { PedidoCard } from '../components/PedidoCard';

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
                <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Mis Pedidos</h1>
                <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                    Historial y estado de tus compras
                </p>
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
                        {pedidosFiltrados.map((pedido) => (
                            <PedidoCard
                                key={pedido.id}
                                pedido={pedido}
                                nombreProducto={nombreProducto}
                                abierto={expandidoId === pedido.id}
                                onToggle={() => setExpandidoId(expandidoId === pedido.id ? null : pedido.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MisPedidosPage;