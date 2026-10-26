import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPedidoPorCodigo } from '../services/pedidosService';
import { getProductos } from '../services/catalogoService';
import { PedidoCard } from '../components/PedidoCard';

// Página pública: no requiere login. Se accede con el código de seguimiento entregado al comprar.
export function SeguirPedidoPage() {
    const [searchParams] = useSearchParams();
    const [codigo, setCodigo] = useState(searchParams.get('codigo') || '');
    const [pedido, setPedido] = useState(null);
    const [productosPorId, setProductosPorId] = useState({});
    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState(null);
    const [abierto, setAbierto] = useState(true);

    useEffect(() => {
        getProductos()
            .then((lista) => {
                const mapa = {};
                (lista || []).forEach((p) => { mapa[p.id] = p; });
                setProductosPorId(mapa);
            })
            .catch(() => {});
    }, []);

    // Si llega ?codigo=XXXX (por ejemplo desde el carrito), busca automáticamente
    useEffect(() => {
        const desdeUrl = searchParams.get('codigo');
        if (desdeUrl) {
            setCodigo(desdeUrl);
            buscar(desdeUrl);
        }
    }, [searchParams]);

    const buscar = async (valor) => {
        const cod = (valor ?? codigo).trim();
        if (!cod) {
            setError('Ingresa tu código de seguimiento.');
            return;
        }
        try {
            setBuscando(true);
            setError(null);
            setPedido(null);
            const data = await getPedidoPorCodigo(cod);
            setPedido(data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('No encontramos un pedido con ese código. Revisa que esté bien escrito.');
            } else {
                setError('No se pudo consultar el pedido. Intenta nuevamente.');
            }
        } finally {
            setBuscando(false);
        }
    };

    const nombreProducto = (id) => productosPorId[id]?.nombre || `Producto #${id}`;

    return (
        <div style={{ padding: '40px 60px', backgroundColor: '#fafbfc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Seguir mi Pedido</h1>
                <p style={{ color: '#8a92a6', margin: '6px 0 0', fontSize: '0.95rem' }}>
                    Ingresa el código de seguimiento que recibiste al realizar tu compra
                </p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #cbd5e1', maxWidth: '720px' }}>
                <form
                    onSubmit={(e) => { e.preventDefault(); buscar(); }}
                    style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                >
                    <input
                        type="text"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        placeholder="Ej: P360-AB12CD"
                        style={{
                            flex: '1 1 240px', minWidth: 0, padding: '12px 16px', borderRadius: '20px',
                            border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700',
                            letterSpacing: '0.05em', textTransform: 'uppercase', outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={buscando}
                        style={{
                            padding: '12px 28px', borderRadius: '20px', border: 'none', backgroundColor: '#dc2626',
                            color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: buscando ? 'not-allowed' : 'pointer',
                            opacity: buscando ? 0.7 : 1
                        }}
                    >
                        {buscando ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                {error && (
                    <p style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.85rem', marginTop: '14px', marginBottom: 0 }}>{error}</p>
                )}

                {pedido && (
                    <div style={{ marginTop: '24px' }}>
                        <PedidoCard
                            pedido={pedido}
                            nombreProducto={nombreProducto}
                            abierto={abierto}
                            onToggle={() => setAbierto(!abierto)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default SeguirPedidoPage;