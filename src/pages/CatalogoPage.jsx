import React, { useEffect, useState } from 'react';
import { getProductos } from '../services/catalogoService';

export function Catalogo({ agregarAlCarrito }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [formatoSeleccionado, setFormatoSeleccionado] = useState("TODOS");

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

            {/* Filtros */}
            {formatos.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                    {formatos.map((fmt) => (
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
            )}

            {/* Grid de Productos */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse space-y-4">
                            <div className="w-full h-48 bg-gray-200 rounded-xl" />
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : productosFiltrados.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 font-semibold">No hay videojuegos para mostrar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productosFiltrados.map((juego) => {
                        const imagen = juego.imagen || juego.imagenUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                        const etiqueta = juego.formato || juego.categoria;
                        const sinStock = juego.stock <= 0;

                        return (
                            <div key={juego.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
                                <div>
                                    <div className="w-full h-52 bg-gray-100 overflow-hidden relative">
                                        <img src={imagen} alt={juego.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>

                                    <div className="p-5 space-y-2">
                                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{juego.nombre}</h3>
                                        {etiqueta && (
                                            <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border bg-gray-50 text-gray-700">
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

                                <div className="p-5 pt-0">
                                    <button
                                        onClick={() => agregarAlCarrito && agregarAlCarrito(juego)}
                                        disabled={sinStock}
                                        className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-md ${
                                            sinStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                    >
                                        {sinStock ? 'Agotado' : 'Agregar al Carrito'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Catalogo;