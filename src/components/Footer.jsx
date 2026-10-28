import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-pedidos670.png";

// ✏️ Datos de la tienda: edítalos aquí (son de ejemplo)
const HORARIOS = [
    { dia: "Lunes a Viernes", horas: "09:00 – 18:00" },
    { dia: "Sábado", horas: "10:00 – 14:00" },
    { dia: "Domingo y festivos", horas: "Cerrado" },
];

const CONTACTO = {
    direccion: "Ugalde 56, Melipilla, Chile",
    telefono: "+56 9 6767 0000",
    correo: "contacto@pedidos670.cl",
};

export function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="w-full bg-red-600 text-white mt-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                    {/* Izquierda: horarios */}
                    <div className="order-2 md:order-1 text-center md:text-left">
                        <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3">Horarios de atención</h4>
                        <ul className="space-y-1.5 text-sm text-red-50">
                            {HORARIOS.map((h) => (
                                <li key={h.dia}>
                                    <span className="font-semibold text-white">{h.dia}:</span> {h.horas}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-red-100">Tienda online disponible las 24 horas.</p>
                    </div>

                    {/* Centro: logo */}
                    <div className="order-1 md:order-2 flex flex-col items-center">
                        <button
                            onClick={() => navigate("/")}
                            aria-label="Ir al catálogo"
                            className="rounded-full bg-white p-2 shadow-lg shadow-red-900/30 hover:scale-105 transition-transform"
                        >
                            <img
                                src={logo}
                                alt="Pedidos 360 - Videojuegos, tienda online"
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-contain"
                            />
                        </button>
                    </div>

                    {/* Derecha: dirección y contacto */}
                    <div className="order-3 text-center md:text-right">
                        <h4 className="text-sm font-extrabold uppercase tracking-wider mb-3">Dirección y contacto</h4>
                        <ul className="space-y-1.5 text-sm text-red-50">
                            <li>{CONTACTO.direccion}</li>
                            <li>
                                <span className="font-semibold text-white">Tel:</span> {CONTACTO.telefono}
                            </li>
                            <li>
                                <span className="font-semibold text-white">Correo:</span> {CONTACTO.correo}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Línea inferior */}
                <div className="mt-8 pt-4 border-t border-red-400/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-red-100">
                    <span>© {new Date().getFullYear()} Pedidos 670. Todos los derechos reservados al SixSeven.</span>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/")} className="hover:text-white underline-offset-2 hover:underline">
                            Catálogo
                        </button>
                        <button onClick={() => navigate("/seguimiento")} className="hover:text-white underline-offset-2 hover:underline">
                            Seguir mi pedido
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;