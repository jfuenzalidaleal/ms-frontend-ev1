import React, { useState } from 'react';
import { crearPedido } from '../services/pedidosService';

export const CarritoModal = ({ show, onHide, carrito, setCarrito, vaciarCarrito }) => {
    const [emailCliente, setEmailCliente] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const handleCantidad = (id, cambio) => {
        setCarrito(
            carrito.map((item) => {
                if (item.id === id) {
                    const nuevaCantidad = item.cantidad + cambio;
                    return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
                }
                return item;
            })
        );
    };

    const handleEliminar = (id) => {
        setCarrito(carrito.filter((item) => item.id !== id));
    };

    const handleComprar = async (e) => {
        e.preventDefault();
        if (carrito.length === 0) return;

        setEnviando(true);
        setMensaje(null);

        // DTO ajustado al estándar habitual de ms-pedidos
        // src/components/CarritoModal.jsx

        // src/components/CarritoModal.jsx

        const payload = {
            clienteId: 1, // ID por defecto o el ID del usuario en sesión
            emailCliente: emailCliente,
            items: carrito.map((item) => ({
                productoId: item.id,
                nombreProducto: item.nombre,
                cantidad: item.cantidad,
                precioUnitario: item.precio,
            })),
            total: total,
        };

        try {
            await crearPedido(payload);
            setMensaje({ tipo: 'success', texto: '¡Pedido realizado con éxito en Oracle Cloud! 🎉' });
            setTimeout(() => {
                vaciarCarrito();
                onHide();
                setMensaje(null);
                setEmailCliente('');
            }, 2000);
        } catch (error) {
            console.error('Error al enviar pedido:', error);
            setMensaje({ tipo: 'danger', texto: 'Error al procesar el pedido con ms-pedidos.' });
        } finally {
            setEnviando(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">🛒 Carrito de Compras</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        {mensaje && (
                            <div className={`alert alert-${mensaje.tipo} text-center`}>{mensaje.texto}</div>
                        )}

                        {carrito.length === 0 ? (
                            <p className="text-center text-muted my-4">El carrito está vacío.</p>
                        ) : (
                            <>
                                <ul className="list-group mb-3">
                                    {carrito.map((item) => (
                                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div className="me-auto">
                                                <h6 className="my-0 fw-bold">{item.nombre}</h6>
                                                <small className="text-muted">
                                                    ${Number(item.precio).toLocaleString('es-CL')} x {item.cantidad}
                                                </small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleCantidad(item.id, -1)}>-</button>
                                                <span className="fw-bold">{item.cantidad}</span>
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleCantidad(item.id, 1)}>+</button>
                                                <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => handleEliminar(item.id)}>🗑️</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-4">
                                    <h5 className="fw-bold mb-0">Total:</h5>
                                    <h4 className="fw-bold text-success mb-0">${Number(total).toLocaleString('es-CL')}</h4>
                                </div>

                                <form onSubmit={handleComprar}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Correo del Cliente</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="ejemplo@correo.com"
                                            required
                                            value={emailCliente}
                                            onChange={(e) => setEmailCliente(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-success w-100 fw-bold" disabled={enviando}>
                                        {enviando ? 'Procesando...' : 'Confirmar y Pagar'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};