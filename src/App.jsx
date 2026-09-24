import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Catalogo } from './pages/CatalogoPage';
import { PedidosList } from './components/PedidosList';
import { CarritoModal } from './components/CarritoModal';
import AuthButtons from "./components/authButtons.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import {useUserRole} from "./hooks/userRole.js";

function App() {
    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const rol = useUserRole();
    console.log("Rol Actual:", rol);

    const agregarAlCarrito = (producto) => {
        setCarrito((prevCarrito) => {
            const existe = prevCarrito.find((item) => item.id === producto.id);
            if (existe) {
                return prevCarrito.map((item) =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prevCarrito, { ...producto, cantidad: 1 }];
        });
    };

    const vaciarCarrito = () => setCarrito([]);
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <BrowserRouter>
            <div>
                <AuthButtons />
            </div>

            <Navbar totalItems={totalItems} abrirCarrito={() => setMostrarCarrito(true)} />

            <Routes>
                <Route path="/" element={<Catalogo agregarAlCarrito={agregarAlCarrito} />} />
                <Route
                    path="/pedidos"
                    element={
                        <ProtectedRoute>
                            <PedidosList />
                        </ProtectedRoute>
                    }
                />
            </Routes>

            <CarritoModal
                show={mostrarCarrito}
                onHide={() => setMostrarCarrito(false)}
                carrito={carrito}
                setCarrito={setCarrito}
                vaciarCarrito={vaciarCarrito}
            />
        </BrowserRouter>
    );
}

export default App;