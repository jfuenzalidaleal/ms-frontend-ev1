import React, { useEffect, useState } from 'react';
import { getPedidos } from '../services/pedidosService';

export const PedidosList = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPedidos();
            setPedidos(data || []);
        } catch (err) {
            console.error('Error al obtener historial de pedidos:', err);
            setError('No se pudo cargar el historial de pedidos desde ms-pedidos.');
        } finally {
            setLoading(false);
        }
    };

    const formatearPrecio = (valor) => {
        return `$${Number(valor || 0).toLocaleString('es-CL')}`;
    };

    const pedidosFiltrados = pedidos.filter((p) => {
        const clienteStr = p.emailCliente || `Cliente #${p.clienteId}`;
        return (
            p.id?.toString().includes(busqueda) ||
            clienteStr.toLowerCase().includes(busqueda.toLowerCase())
        );
    });

    return (
        <div className="w-full space-y-6">

            {/* Header con Buscador y Re-carga */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Historial de Pedidos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Consulta las órdenes de compra registradas en ms-pedidos
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Buscador */}
                    <div className="relative w-full sm:w-64">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar N° o email..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Botón Actualizar */}
                    <button
                        onClick={cargarPedidos}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 text-red-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Banner de Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-700 text-sm">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{error}</span>
                    </div>
                    <button onClick={cargarPedidos} className="underline font-bold text-red-800 hover:text-red-900">
                        Reintentar
                    </button>
                </div>
            )}

            {/* Estado Carga */}
            {loading ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    <div className="h-12 bg-gray-100 rounded-xl w-full" />
                    <div className="h-12 bg-gray-100 rounded-xl w-full" />
                    <div className="h-12 bg-gray-100 rounded-xl w-full" />
                </div>
            ) : pedidosFiltrados.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 font-semibold">
                        {busqueda ? "No se encontraron pedidos que coincidan con la búsqueda." : "No hay pedidos registrados aún."}
                    </p>
                </div>
            ) : (
                /* Tabla Tailwind */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4"># Pedido</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Detalle de Productos</th>
                                <th className="px-6 py-4 text-right">Total</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {pedidosFiltrados.map((pedido) => {
                                const itemsList = pedido.items || pedido.detalles || [];
                                return (
                                    <tr key={pedido.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-extrabold text-gray-900">
                                            #{pedido.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                                <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 border border-gray-200/60">
                                                    {pedido.emailCliente || `Cliente #${pedido.clienteId}`}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ul className="space-y-1.5">
                                                {itemsList.map((item, idx) => (
                                                    <li key={idx} className="flex items-center text-xs text-gray-700 font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2 flex-shrink-0" />
                                                        <span>
                                                                {item.nombreProducto || `Producto #${item.productoId}`}
                                                            </span>
                                                        <span className="ml-1 text-gray-400 font-bold">x{item.cantidad}</span>
                                                        <span className="ml-2 text-gray-400">
                                                                ({formatearPrecio(item.precioUnitario)})
                                                            </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-lg text-emerald-600">
                                            {formatearPrecio(pedido.total)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedidosList;