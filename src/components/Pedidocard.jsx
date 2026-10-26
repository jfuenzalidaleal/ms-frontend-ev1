import React from 'react';

export const FLUJO = ['CREADO', 'ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

export const ESTADOS = {
    CREADO: { label: 'Recibido', color: '#dc3545' },
    ACEPTADO: { label: 'Aceptado', color: '#0d6efd' },
    EN_PREPARACION: { label: 'En preparación', color: '#d97706' },
    DESPACHADO: { label: 'Despachado', color: '#0284c7' },
    ENTREGADO: { label: 'Entregado', color: '#198754' },
    CANCELADO: { label: 'Cancelado', color: '#8a92a6' }
};

export const getLabel = (e) => ESTADOS[e]?.label || e;
export const getColor = (e) => ESTADOS[e]?.color || '#333';
export const formatearPrecio = (v) => `$${Number(v || 0).toLocaleString('es-CL')}`;
export const formatearFecha = (f) => {
    if (!f) return '';
    try {
        return new Date(f).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return f; }
};

function Tracker({ estado }) {
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
}

// Tarjeta de un pedido: se usa en "Mis Pedidos" (logueado) y en "Seguir mi Pedido" (invitado)
export function PedidoCard({ pedido, nombreProducto, abierto, onToggle }) {
    const cantItems = (pedido.items || []).reduce((s, i) => s + (i.cantidad || 0), 0);
    return (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', minWidth: 0, backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>Pedido #{pedido.id}</div>
                    {pedido.codigoSeguimiento && (
                        <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '800', marginTop: '2px', letterSpacing: '0.04em' }}>
                            Código: {pedido.codigoSeguimiento}
                        </div>
                    )}
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
                    onClick={onToggle}
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
}

export default PedidoCard;