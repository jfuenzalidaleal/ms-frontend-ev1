import React, { useEffect, useState } from 'react';
import { getProductos } from '../services/catalogoService';

export function Catalogo({ agregarAlCarrito }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [formatoSeleccionado, setFormatoSeleccionado] = useState("TODOS");
    const [vista, setVista] = useState(() => {
        try { return localStorage.getItem("catalogoVista") === "lista" ? "lista" : "cuadricula"; }
        catch { return "cuadricula"; }
    });

    const cambiarVista = (v) => {
        setVista(v);
        try { localStorage.setItem("catalogoVista", v); } catch { /* sin almacenamiento */ }
    };

    const cargarCatalogo = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProductos();
            setProductos(data || []);
        } catch (err) {
            console.error('Error al conectar con ms-catalogo:', err);
            setError('No se pudo cargar el catálogo de videojuegos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCatalogo();
    }, []);

    // Filtros
    const formatos = ["TODOS", ...new Set(productos.map((p) => p.formato || p.categoria).filter(Boolean))];
    const productosFiltrados = productos.filter((juego) => {
        const coincideBusqueda =
            (juego.nombre && juego.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
            (juego.descripcion && juego.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
        const etiquetaFormato = juego.formato || juego.categoria;
        const coincideFormato = formatoSeleccionado === "TODOS" || etiquetaFormato === formatoSeleccionado;
        return coincideBusqueda && coincideFormato;
    });

    const formatearPrecio = (valor) => `$${Number(valor || 0).toLocaleString('es-CL')}`;

    return (
        <div className="w-full space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Catálogo de Videojuegos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Explora nuestros títulos disponibles</p>
                </div>

                {/* Buscador */}
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Buscar juego..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Banner Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-700 text-sm">
                    <span className="font-semibold">{error}</span>
                    <button onClick={cargarCatalogo} className="underline font-bold text-red-800">Reintentar</button>
                </div>
            )}

            {/* Filtros + selector de vista */}
            <div className="flex items-center justify-between gap-4 px-1 sm:px-4">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                    {formatos.length > 1 && formatos.map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setFormatoSeleccionado(fmt)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                formatoSeleccionado === fmt
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>

                <div className="flex shrink-0 gap-1 rounded-xl border border-gray-200 bg-white p-1.5 mb-2 mr-1 sm:mr-3" role="group" aria-label="Tipo de vista">
                    <button
                        onClick={() => cambiarVista("cuadricula")}
                        aria-pressed={vista === "cuadricula"}
                        title="Ver en cuadrícula"
                        className={`p-2 rounded-lg transition-all ${vista === "cuadricula" ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    </button>
                    <button
                        onClick={() => cambiarVista("lista")}
                        aria-pressed={vista === "lista"}
                        title="Ver en lista"
                        className={`p-2 rounded-lg transition-all ${vista === "lista" ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
                    </button>
                </div>
            </div>

            {/* Productos: cuadrícula o lista (sin cards: cada producto va separado por una línea corta) */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="animate-pulse space-y-4">
                            <div className="w-full h-48 bg-gray-200 rounded-xl" />
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="mx-auto h-px w-2/3 bg-gray-200" />
                        </div>
                    ))}
                </div>
            ) : productosFiltrados.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 font-semibold">No hay videojuegos para mostrar.</p>
                </div>
            ) : vista === "lista" ? (
                <div className="flex flex-col max-w-3xl mx-auto">
                    {productosFiltrados.map((juego, i) => {
                        const imagen = juego.imagen || juego.imagenUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                        const etiqueta = juego.formato || juego.categoria;
                        const sinStock = juego.stock <= 0;

                        return (
                            <div key={juego.id}>
                                <div className="flex items-center gap-4 sm:gap-8 py-3 px-4 sm:px-8">
                                    <div className="w-16 h-16 sm:w-20 sm:h-16 shrink-0 bg-gray-100 overflow-hidden rounded-xl">
                                        <img src={imagen} alt={juego.nombre} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="font-bold text-gray-900 text-base truncate">{juego.nombre}</h3>
                                        {juego.descripcion && (
                                            <p className="hidden sm:block text-sm text-gray-500 line-clamp-1">{juego.descripcion}</p>
                                        )}
                                        <div className="flex items-center gap-3">
                                            {etiqueta && (
                                                <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border border-gray-300 bg-gray-50 text-gray-700">
                                                    {etiqueta}
                                                </span>
                                            )}
                                            <span className={`text-xs font-semibold ${sinStock ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                Stock: {juego.stock ?? 0} u.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-8 shrink-0">
                                        <p className="text-xl sm:text-2xl font-black text-gray-900">{formatearPrecio(juego.precio)}</p>
                                        <button
                                            onClick={() => agregarAlCarrito && agregarAlCarrito(juego)}
                                            disabled={sinStock}
                                            className={`font-bold py-2 px-4 rounded-xl transition-all shadow-md whitespace-nowrap text-sm ${
                                                sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 text-white'
                                            }`}
                                        >
                                            {sinStock ? 'Agotado' : 'Agregar'}
                                        </button>
                                    </div>
                                </div>
                                {i < productosFiltrados.length - 1 && <div className="mx-auto h-px w-2/3 bg-gray-300" />}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
                    {productosFiltrados.map((juego) => {
                        const imagen = juego.imagen || juego.imagenUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                        const etiqueta = juego.formato || juego.categoria;
                        const sinStock = juego.stock <= 0;

                        return (
                            <div key={juego.id} className="group flex flex-col justify-between">
                                <div>
                                    <div className="w-full h-52 bg-gray-100 overflow-hidden rounded-xl">
                                        <img src={imagen} alt={juego.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{juego.nombre}</h3>
                                        {etiqueta && (
                                            <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border border-gray-300 bg-gray-50 text-gray-700">
                                                {etiqueta}
                                            </span>
                                        )}
                                        <div className="pt-2 flex items-baseline justify-between">
                                            <p className="text-2xl font-black text-gray-900">{formatearPrecio(juego.precio)}</p>
                                            <span className={`text-xs font-semibold ${sinStock ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                Stock: {juego.stock ?? 0} u.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => agregarAlCarrito && agregarAlCarrito(juego)}
                                        disabled={sinStock}
                                        className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-md ${
                                            sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                    >
                                        {sinStock ? 'Agotado' : 'Agregar al Carrito'}
                                    </button>
                                </div>

                                {/* Línea separadora corta (no ocupa todo el ancho) */}
                                <div className="mt-8 mx-auto h-px w-2/3 bg-gray-300" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Catalogo;