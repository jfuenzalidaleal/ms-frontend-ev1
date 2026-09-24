import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = ({ totalItems, abrirCarrito }) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">🛒 Pedidos 360</Link>
                <div className="navbar-nav me-auto">
                    <Link className="nav-link" to="/">Catálogo</Link>
                    <Link className="nav-link" to="/pedidos">Historial de Pedidos</Link>
                </div>
                <button className="btn btn-outline-light position-relative" onClick={abrirCarrito}>
                    🛒 Carrito
                    {totalItems > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {totalItems}
            </span>
                    )}
                </button>
            </div>
        </nav>
    );
};