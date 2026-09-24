import React, { useEffect, useState } from 'react';
import { getProductos } from '../services/catalogoService';

export const Catalogo = ({ agregarAlCarrito }) => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarCatalogo();
    }, []);

    const cargarCatalogo = async () => {
        try {
            setLoading(true);
            const data = await getProductos();
            setProductos(data);
        } catch (err) {
            console.error('Error al conectar con ms-catalogo:', err);
            setError('No se pudo cargar el catálogo de videojuegos.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center mt-5">🎮 Cargando videojuegos desde la nube...</div>;
    }

    if (error) {
        return <div className="alert alert-danger m-4 text-center">{error}</div>;
    }

    return (
        <div className="container my-4">
            <h2 className="mb-4 font-weight-bold">🕹️ Catálogo de Videojuegos</h2>
            <div className="row g-4">
                {productos.map((juego) => (
                    <div key={juego.id} className="col-12 col-md-6 col-lg-3">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                <span className={`badge mb-2 align-self-start ${juego.formato === 'DIGITAL' ? 'bg-primary' : 'bg-success'}`}>
                  {juego.formato}
                </span>
                                <h5 className="card-title fw-bold">{juego.nombre}</h5>
                                <p className="card-text text-muted flex-grow-1">{juego.descripcion}</p>

                                <div className="mt-auto">
                                    <p className="fs-4 fw-bold text-dark mb-1">
                                        ${Number(juego.precio).toLocaleString('es-CL')}
                                    </p>
                                    <p className="small text-secondary mb-3">
                                        Stock: {juego.stock} unidades
                                    </p>
                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={() => agregarAlCarrito && agregarAlCarrito(juego)}
                                        disabled={juego.stock <= 0}
                                    >
                                        {juego.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};