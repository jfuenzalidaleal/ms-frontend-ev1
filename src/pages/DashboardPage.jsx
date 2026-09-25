import React from 'react';
import { useUserRole } from '../hooks/userRole.js';
import { AdminDashboard } from '../components/AdminDashboard.jsx';
import { OperadorDashboard } from '../components/OperadorDashboard.jsx';

export function DashboardPage() {
    const rol = useUserRole();

    if (rol === 'ADMIN') {
        return <AdminDashboard />;
    }

    if (rol === 'OPERADOR') {
        return <OperadorDashboard />;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto my-12 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
            <p className="text-gray-500 text-sm">
                No posees permisos administrativos u operativos para visualizar esta sección.
            </p>
        </div>
    );
}

export default DashboardPage;