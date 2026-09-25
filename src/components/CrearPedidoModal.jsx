import React, { useState } from 'react';
import { crearPedido } from '../services/pedidosService';

export function CrearPedidoModal({ productos, onClose, onCreated }) {
    const [clienteId, setClienteId] = useState('');
    const [itemsPedido, setItemsPedido] = useState([]); // [{productoId, nombre, precioUnitario, cantidad}]
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState(null);

    const formatearPrecio = (valor) => `$${Number(valor || 0).toLocaleString('es-CL')}`;

    const total = itemsPedido.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);

    const agregarItem = () => {
        setErrorForm(null);
        if (!productoSeleccionado) {
            setErrorForm('Selecciona un producto para agregar.');
            return;
        }
        const cantidad = Number(cantidadSeleccionada);
        if (!cantidad || cantidad <= 0) {
            setErrorForm('La cantidad debe ser mayor a 0.');
            return;
        }

        const producto = productos.find(p => String(p.id) === String(productoSeleccionado));
        if (!producto) return;

        // Validación de stock: considera lo que ya está agregado de este mismo producto
        const existente = itemsPedido.find(i => i.productoId === producto.id);
        const cantidadYaAgregada = existente?.cantidad || 0;
        const stockDisponible = producto.stock ?? 0;

        if (cantidadYaAgregada + cantidad > stockDisponible) {
            const disponibleReal = stockDisponible - cantidadYaAgregada;
            setErrorForm(
                `No hay suficiente stock de "${producto.nombre}". Disponible: ${stockDisponible} unidad(es)` +
                (cantidadYaAgregada > 0 ? ` (ya agregaste ${cantidadYaAgregada}, puedes agregar hasta ${Math.max(disponibleReal, 0)} más).` : '.')
            );
            return;
        }

        setItemsPedido(prev => {
            if (existente) {
                return prev.map(i =>
                    i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
                );
            }
            return [
                ...prev,
                {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    precioUnitario: producto.precio,
                    cantidad
                }
            ];
        });

        setProductoSeleccionado('');
        setCantidadSeleccionada(1);
    };

    const quitarItem = (productoId) => {
        setItemsPedido(prev => prev.filter(i => i.productoId !== productoId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorForm(null);

        if (!clienteId.trim()) {
            setErrorForm('Debes indicar el ID o correo del cliente.');
            return;
        }
        if (itemsPedido.length === 0) {
            setErrorForm('Agrega al menos un producto al pedido.');
            return;
        }

        // Validación final de stock (por si el catálogo cambió mientras se armaba el pedido)
        for (const item of itemsPedido) {
            const producto = productos.find(p => p.id === item.productoId);
            const stockDisponible = producto?.stock ?? 0;
            if (item.cantidad > stockDisponible) {
                setErrorForm(`No hay suficiente stock de "${item.nombre}". Disponible: ${stockDisponible} unidad(es).`);
                return;
            }
        }

        const payload = {
            clienteId: clienteId.trim(),
            estado: 'CREADO',
            total: total,
            items: itemsPedido.map(i => ({
                productoId: i.productoId,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario
            }))
        };

        try {
            setGuardando(true);
            await crearPedido(payload);
            onCreated();
            onClose();
        } catch (err) {
            const msj = err.response?.data?.message || err.response?.data || err.message;
            setErrorForm(`Error al crear pedido: ${msj}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div
            onClick={onClose}
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
                    width: '520px', maxWidth: '92%', maxHeight: '85vh', overflowY: 'auto',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
            >
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                    Crear Nuevo Pedido
                </h3>

                <form onSubmit={handleSubmit}>
                    {/* Cliente */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            ID o correo del cliente
                        </label>
                        <input
                            type="text"
                            placeholder="ej: cliente@correo.com"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Selector de productos */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                            Agregar producto
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                                value={productoSeleccionado}
                                onChange={(e) => setProductoSeleccionado(e.target.value)}
                                style={{ flex: 3, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}
                            >
                                <option value="">Selecciona un producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                        {p.nombre} — {formatearPrecio(p.precio)} ({p.stock <= 0 ? 'Sin stock' : `${p.stock} disp.`})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={cantidadSeleccionada}
                                onChange={(e) => setCantidadSeleccionada(e.target.value)}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                            />
                            <button
                                type="button"
                                onClick={agregarItem}
                                style={{
                                    padding: '10px 16px', borderRadius: '8px', border: 'none',
                                    backgroundColor: '#0f172a', color: '#fff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {/* Lista de ítems agregados */}
                    <div style={{ marginBottom: '18px', border: '1px solid #f1f5f9', borderRadius: '10px', padding: itemsPedido.length ? '10px' : '0' }}>
                        {itemsPedido.length === 0 ? (
                            <p style={{ color: '#8a92a6', fontSize: '0.85rem', padding: '14px', textAlign: 'center', margin: 0 }}>
                                Aún no has agregado productos.
                            </p>
                        ) : (
                            itemsPedido.map(item => (
                                <div key={item.productoId} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 4px', borderBottom: '1px solid #f8fafc', fontSize: '0.85rem'
                                }}>
                                    <span style={{ fontWeight: '700', color: '#0f172a' }}>
                                        {item.cantidad}x {item.nombre}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: '700', color: '#475569' }}>
                                            {formatearPrecio(item.precioUnitario * item.cantidad)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => quitarItem(item.productoId)}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1rem', color: '#0f172a', marginBottom: '18px' }}>
                        <span>Total</span>
                        <span style={{ color: '#dc2626' }}>{formatearPrecio(total)}</span>
                    </div>

                    {errorForm && (
                        <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '600', marginBottom: '14px' }}>
                            {errorForm}
                        </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
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
                            {guardando ? 'Creando...' : 'Crear Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CrearPedidoModal;