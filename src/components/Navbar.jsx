import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { useUserRole } from "../hooks/userRole";

export function Navbar({ cartCount = 0, onOpenCart }) {
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();
    const { rol: role, loading: roleLoading } = useUserRole(); // <-- actualizado
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const activeAccount = instance?.getActiveAccount() || (accounts && accounts.length > 0 ? accounts[0] : null);
    const userName = activeAccount?.name || activeAccount?.username?.split("@")[0] || "Usuario";

    const esAdminOOperador = role === "ADMIN" || role === "OPERADOR";

    const handleLogin = () => {
        if (instance) instance.loginRedirect(loginRequest);
    };

    const handleLogout = () => {
        if (instance) instance.logoutRedirect({ postLogoutRedirectUri: "/" });
    };

    const getRoleBadge = (userRole) => {
        if (!userRole) return null;
        return (
            <span className="ml-1.5 text-xs font-bold text-red-600 tracking-wide">
                {userRole}
            </span>
        );
    };

    return (
        <nav className="w-full bg-white border-b border-gray-200 text-gray-800 shadow-sm sticky top-0 z-50">
            <div className="w-full px-4 sm:px-6 lg:px-12">
                <div className="flex items-center justify-between h-16">

                    {/* Logo & Pestañas */}
                    <div className="flex items-center space-x-10 h-full">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center space-x-2 text-red-600 font-extrabold text-2xl hover:text-red-700 transition-all transform hover:scale-105"
                        >
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="tracking-tight">Pedidos 360</span>
                        </button>

                        {/* Navegación con Subrayado */}
                        <div className="hidden md:flex space-x-8 h-full">
                            <button
                                onClick={() => navigate("/")}
                                className={`inline-flex items-center h-full border-b-2 text-sm transition-all px-1 ${
                                    location.pathname === "/"
                                        ? "border-red-600 text-red-600 font-bold"
                                        : "border-transparent text-gray-600 hover:text-red-600 hover:border-red-300 font-semibold"
                                }`}
                            >
                                Catálogo
                            </button>

                            {/* Pestaña Dashboard (Exclusiva para ADMIN u OPERADOR) */}
                            {/* Se oculta mientras roleLoading es true, para no mostrarla y quitarla de golpe */}
                            {isAuthenticated && !roleLoading && esAdminOOperador && (
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className={`inline-flex items-center h-full border-b-2 text-sm transition-all px-1 ${
                                        location.pathname === "/dashboard"
                                            ? "border-red-600 text-red-600 font-bold"
                                            : "border-transparent text-gray-600 hover:text-red-600 hover:border-red-300 font-semibold"
                                    }`}
                                >
                                    Dashboard
                                </button>
                            )}

                        </div>
                    </div>

                    {/* Lado Derecho: Carrito y Perfil / Login */}
                    <div className="flex items-center space-x-4">
                        {/* Botón Carrito */}
                        <button
                            onClick={onOpenCart}
                            className="relative flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 border border-gray-200"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            <span className="hidden sm:inline">Carrito</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Menú Usuario / Login */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 transition-all"
                                >
                                    <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden md:inline font-semibold text-gray-800">{userName}</span>
                                    {!roleLoading && getRoleBadge(role)}
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-200 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-xs text-gray-400 font-medium">Conectado como:</p>
                                            <p className="text-xs text-gray-700 font-bold truncate">{activeAccount?.username}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors font-semibold mt-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Cerrar Sesión</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition-all shadow-md shadow-red-600/20 flex items-center space-x-2 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Iniciar Sesión</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
