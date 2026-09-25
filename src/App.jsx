import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importación de componentes y páginas
import Navbar from './components/Navbar';
import Catalogo from './pages/CatalogoPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OperadorDashboard } from './components/OperadorDashboard';

// Importación del hook de roles (el mismo que usa tu Navbar)
import { useUserRole } from './hooks/userRole';

// Componente para decidir qué Dashboard mostrar según el rol de MSAL
function DashboardController() {
    const { rol, loading } = useUserRole();

    // Mientras MSAL resuelve el token, no decidimos nada todavía
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

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar superior persistente en todas las pantallas */}
            <Navbar />

            {/* Enrutamiento dinámico según la URL que activa el Navbar */}
            <main>
                <Routes>
                    {/* Ruta Principal: Catálogo */}
                    <Route path="/" element={<Catalogo />} />

                    {/* Ruta Dashboard: Redirige dinámicamente a Admin o a Operador según el rol */}
                    <Route path="/dashboard" element={<DashboardController />} />

                    {/* Ruta Pedidos (Para Admin/Operador lleva al Dashboard, para Cliente al Catálogo) */}
                    <Route path="/pedidos" element={<DashboardController />} />

                    {/* Cualquier otra ruta no encontrada redirige al catálogo */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;