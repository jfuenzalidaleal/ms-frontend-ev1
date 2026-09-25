import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importación de componentes y páginas
import Navbar from './components/Navbar';
import Catalogo from './pages/CatalogoPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OperadorDashboard } from './components/OperadorDashboard';
import { CarritoModal } from './components/CarritoModal';
import { MisPedidosPage } from './pages/MisPedidosPage';

// Importación del hook de roles (el mismo que usa tu Navbar)
import { useUserRole } from './hooks/userRole';

// Componente para decidir qué Dashboard mostrar según el rol de MSAL (solo Admin/Operador)
function DashboardController() {
    const { rol, loading } = useUserRole();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    const roleUpper = String(rol || '').toUpperCase();

    if (roleUpper === 'ADMIN') {
        return <AdminDashboard />;
    }
    if (roleUpper === 'OPERADOR') {
        return <OperadorDashboard />;
    }

    // Si un cliente o usuario no autorizado intenta entrar a /dashboard, lo devuelve al catálogo
    return <Navigate to="/" replace />;
}

// Componente para decidir qué mostrar en /pedidos según el rol:
// Admin/Operador ven su panel de gestión; Cliente ve solo sus propios pedidos.
function PedidosController() {
    const { rol, loading } = useUserRole();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    const roleUpper = String(rol || '').toUpperCase();

    if (roleUpper === 'ADMIN') {
        return <AdminDashboard />;
    }
    if (roleUpper === 'OPERADOR') {
        return <OperadorDashboard />;
    }
    if (roleUpper === 'CLIENTE') {
        return <MisPedidosPage />;
    }

    // Usuario no autenticado o sin rol reconocido
    return <Navigate to="/" replace />;
}

function App() {
    // --- Estado global del carrito de compras ---
    const [carrito, setCarrito] = useState([]);
    const [carritoAbierto, setCarritoAbierto] = useState(false);

    const agregarAlCarrito = (producto) => {
        setCarrito((prev) => {
            const existente = prev.find((item) => item.id === producto.id);
            const stockDisponible = producto.stock ?? 0;
            const cantidadActual = existente?.cantidad || 0;

            // Validación de stock: no permitir agregar más unidades de las disponibles
            if (cantidadActual + 1 > stockDisponible) {
                alert(`No hay suficiente stock de "${producto.nombre}". Disponible: ${stockDisponible} unidad(es).`);
                return prev; // no modifica el carrito
            }

            if (existente) {
                return prev.map((item) =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
        setCarritoAbierto(true); // abre el carrito automáticamente al agregar un producto
    };

    const vaciarCarrito = () => setCarrito([]);

    const cartCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar superior persistente en todas las pantallas */}
            <Navbar cartCount={cartCount} onOpenCart={() => setCarritoAbierto(true)} />

            {/* Enrutamiento dinámico según la URL que activa el Navbar */}
            <main>
                <Routes>
                    {/* Ruta Principal: Catálogo */}
                    <Route path="/" element={<Catalogo agregarAlCarrito={agregarAlCarrito} />} />

                    {/* Ruta Dashboard: Redirige dinámicamente a Admin o a Operador según el rol */}
                    <Route path="/dashboard" element={<DashboardController />} />

                    {/* Ruta Pedidos: Admin/Operador ven gestión completa, Cliente ve solo los suyos */}
                    <Route path="/pedidos" element={<PedidosController />} />

                    {/* Cualquier otra ruta no encontrada redirige al catálogo */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            {/* Modal del carrito, disponible en toda la app */}
            <CarritoModal
                show={carritoAbierto}
                onHide={() => setCarritoAbierto(false)}
                carrito={carrito}
                setCarrito={setCarrito}
                vaciarCarrito={vaciarCarrito}
            />
        </div>
    );
}

export default App;