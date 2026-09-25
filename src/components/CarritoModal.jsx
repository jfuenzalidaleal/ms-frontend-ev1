import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { crearPedido } from '../services/pedidosService';

export function CarritoModal({ show, onHide, carrito, setCarrito, vaciarCarrito }) {
    const { accounts } = useMsal();
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState(null);

    if (!show) return null;

    const total = carrito.reduce((acc, item) => {
        const precio = item.precio ?? item.precioUnitario ?? 0;
        return acc + precio * item.cantidad;
    }, 0);

    const formatearPrecio = (valor) => `$${Number(valor || 0).toLocaleString('es-CL')}`;

    const cambiarCantidad = (id, delta) => {
        setError(null);

        setCarrito((prev) =>
            prev
                .map((item) => {
                    if (item.id !== id) return item;

                    const nuevaCant = item.cantidad + delta;

                    // Validación de stock: solo aplica al incrementar (delta > 0)
                    if (delta > 0) {
                        const stockDisponible = item.stock ?? 0;
                        if (nuevaCant > stockDisponible) {
                            setError(`No hay suficiente stock de "${item.nombre}". Disponible: ${stockDisponible} unidad(es).`);
                            return item; // no modifica la cantidad
                        }
                    }

                    return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
                })
                .filter(Boolean)
        );
    };

    const eliminarProducto = (id) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    const handleCheckout = async () => {
        if (carrito.length === 0) return;

        // Validación final de stock antes de confirmar la compra
        const itemSinStock = carrito.find((item) => item.cantidad > (item.stock ?? 0));
        if (itemSinStock) {
            setError(`No hay suficiente stock de "${itemSinStock.nombre}". Disponible: ${itemSinStock.stock ?? 0} unidad(es).`);
            return;
        }

        const clienteId = accounts?.[0]?.username;
        if (!clienteId) {
            setError("No se pudo identificar tu sesión. Vuelve a iniciar sesión e intenta de nuevo.");
            return;
        }

        setEnviando(true);
        setError(null);

        try {
            const payload = {
                clienteId,
                estado: 'CREADO',
                total: total,
                items: carrito.map((item) => ({
                    productoId: item.id,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio ?? item.precioUnitario ?? 0
                }))
            };

            await crearPedido(payload);
            setExito(true);
            vaciarCarrito();
            setTimeout(() => {
                setExito(false);
                onHide();
            }, 2500);
        } catch (err) {
            console.error("Error al procesar el pedido:", err);
            setError("No se pudo procesar la compra. Intenta nuevamente.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                onClick={onHide}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">

                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Tu Carrito</h2>
                                <p className="text-xs text-gray-400 font-medium">
                                    {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'} añadidos
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onHide}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {exito ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">¡Pedido Realizado!</h3>
                            <p className="text-sm text-gray-500">Tu orden ha sido registrada exitosamente en el sistema.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-gray-100">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                                    {error}
                                </div>
                            )}

                            {carrito.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <p className="text-gray-500 font-semibold text-sm">Tu carrito está vacío</p>
                                    <button
                                        onClick={onHide}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                                    >
                                        Explorar productos
                                    </button>
                                </div>
                            ) : (
                                carrito.map((item) => {
                                    const nombre = item.nombre || item.nombreProducto || "Producto";
                                    const precio = item.precio ?? item.precioUnitario ?? 0;
                                    const imagen = item.imagen || item.imagenUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                                    const alcanzoStockMaximo = item.cantidad >= (item.stock ?? 0);

                                    return (
                                        <div key={item.id} className="pt-4 first:pt-0 flex space-x-4 items-center">
                                            <img
                                                src={imagen}
                                                alt={nombre}
                                                className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0 border border-gray-100"
                                                onError={(e) => {
                                                    e.target.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                                                }}
                                            />

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{nombre}</h4>
                                                <p className="text-xs font-bold text-red-600 mt-0.5">
                                                    {formatearPrecio(precio)}
                                                </p>

                                                <div className="flex items-center space-x-2 mt-2">
                                                    <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => cambiarCantidad(item.id, -1)}
                                                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 rounded-l-lg font-bold text-xs"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 text-xs font-bold text-gray-800">
                                                            {item.cantidad}
                                                        </span>
                                                        <button
                                                            onClick={() => cambiarCantidad(item.id, 1)}
                                                            disabled={alcanzoStockMaximo}
                                                            title={alcanzoStockMaximo ? 'Alcanzaste el stock disponible' : undefined}
                                                            className={`px-2 py-0.5 rounded-r-lg font-bold text-xs ${
                                                                alcanzoStockMaximo
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => eliminarProducto(item.id)}
                                                        className="text-xs text-gray-400 hover:text-red-600 font-medium transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>

                                                {alcanzoStockMaximo && (
                                                    <p className="text-[11px] text-amber-600 font-semibold mt-1">
                                                        Stock máximo alcanzado ({item.stock ?? 0} disponibles)
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right font-extrabold text-sm text-gray-900">
                                                {formatearPrecio(precio * item.cantidad)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {!exito && carrito.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Subtotal</span>
                                    <span>{formatearPrecio(total)}</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-gray-900 pt-1 border-t border-gray-200/60">
                                    <span>Total</span>
                                    <span className="text-red-600">{formatearPrecio(total)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={handleCheckout}
                                    disabled={enviando}
                                    className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {enviando ? (
                                        <svg className="w-5 h-5 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    ) : (
                                        <>
                                            <span>Procesar Pedido</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={vaciarCarrito}
                                    className="w-full text-center text-xs font-semibold text-gray-400 hover:text-red-600 py-1 transition-colors"
                                >
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CarritoModal;