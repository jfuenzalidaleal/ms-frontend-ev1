import React, { useState } from 'react';

// ⚠️ PAGO SIMULADO (solo demostración): no se conecta a ningún banco ni pasarela.
// Los datos de la tarjeta se validan aquí y se descartan: NO se envían ni se guardan en el backend.

const ROJO = '#dc2626';

// Tarjetas de prueba para la demostración (válidas por Luhn)
const TARJETA_APROBADA = '4242424242424242';
const TARJETA_RECHAZADA = '4000000000000002';

const formatearPrecio = (v) => `$${Number(v || 0).toLocaleString('es-CL')}`;

// Algoritmo de Luhn: valida que el número de tarjeta sea "matemáticamente" posible
const luhnValido = (numero) => {
    let suma = 0;
    let alternar = false;
    for (let i = numero.length - 1; i >= 0; i--) {
        let n = parseInt(numero[i], 10);
        if (alternar) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        suma += n;
        alternar = !alternar;
    }
    return suma % 10 === 0;
};

const detectarMarca = (numero) => {
    if (/^4/.test(numero)) return 'Visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(numero)) return 'Mastercard';
    if (/^3[47]/.test(numero)) return 'American Express';
    return null;
};

const soloDigitos = (v) => v.replace(/\D/g, '');

const formatearNumero = (v) => {
    const d = soloDigitos(v).slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
};

const formatearVencimiento = (v) => {
    const d = soloDigitos(v).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export function PagoModal({ total, onClose, onApproved }) {
    const [tipo, setTipo] = useState('CREDITO');
    const [numero, setNumero] = useState('');
    const [titular, setTitular] = useState('');
    const [vencimiento, setVencimiento] = useState('');
    const [cvv, setCvv] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);

    const digitos = soloDigitos(numero);
    const marca = detectarMarca(digitos);

    const validar = () => {
        if (digitos.length < 13 || digitos.length > 19 || !luhnValido(digitos)) {
            return 'El número de tarjeta no es válido.';
        }
        if (titular.trim().length < 3) {
            return 'Ingresa el nombre que aparece en la tarjeta.';
        }
        const m = vencimiento.match(/^(\d{2})\/(\d{2})$/);
        if (!m) return 'El vencimiento debe tener el formato MM/AA.';
        const mes = parseInt(m[1], 10);
        const anio = 2000 + parseInt(m[2], 10);
        if (mes < 1 || mes > 12) return 'El mes de vencimiento no es válido.';
        const hoy = new Date();
        const finMes = new Date(anio, mes, 0, 23, 59, 59); // último día del mes de vencimiento
        if (finMes < hoy) return 'La tarjeta está vencida.';
        const largoCvv = marca === 'American Express' ? 4 : 3;
        if (cvv.length !== largoCvv) return `El CVV debe tener ${largoCvv} dígitos.`;
        return null;
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        if (procesando) return;

        const errorValidacion = validar();
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setError(null);
        setProcesando(true);

        // Simula la comunicación con el banco
        await esperar(1800);

        if (digitos === TARJETA_RECHAZADA) {
            setProcesando(false);
            setError('Pago rechazado por el banco emisor. Intenta con otra tarjeta.');
            return;
        }

        // Pago aprobado: los datos de la tarjeta se descartan, solo se avisa al carrito
        setProcesando(false);
        onApproved();
    };

    const input = {
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
        boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none'
    };
    const label = { display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' };

    return (
        <div
            onClick={procesando ? undefined : onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px', boxSizing: 'border-box'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
                    width: '440px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
                    boxSizing: 'border-box', boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Pago con tarjeta</h3>
                    <span style={{ fontWeight: '800', color: ROJO, fontSize: '1.1rem' }}>{formatearPrecio(total)}</span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#64748b' }}>
                    Modo demostración: no se realiza ningún cobro real.
                </p>

                <form onSubmit={handlePagar}>
                    {/* Crédito / Débito */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {[{ id: 'CREDITO', texto: 'Crédito' }, { id: 'DEBITO', texto: 'Débito' }].map((op) => (
                            <button
                                key={op.id}
                                type="button"
                                onClick={() => setTipo(op.id)}
                                disabled={procesando}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem',
                                    cursor: 'pointer', border: `2px solid ${tipo === op.id ? ROJO : '#cbd5e1'}`,
                                    backgroundColor: tipo === op.id ? ROJO : '#fff',
                                    color: tipo === op.id ? '#fff' : '#475569'
                                }}
                            >
                                {op.texto}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={label}>
                            Número de tarjeta {marca && <span style={{ color: ROJO, marginLeft: '6px' }}>{marca}</span>}
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="0000 0000 0000 0000"
                            value={numero}
                            onChange={(e) => setNumero(formatearNumero(e.target.value))}
                            disabled={procesando}
                            style={input}
                        />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={label}>Nombre del titular</label>
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Como aparece en la tarjeta"
                            value={titular}
                            onChange={(e) => setTitular(e.target.value.toUpperCase())}
                            disabled={procesando}
                            style={input}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={label}>Vencimiento</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="MM/AA"
                                value={vencimiento}
                                onChange={(e) => setVencimiento(formatearVencimiento(e.target.value))}
                                disabled={procesando}
                                style={input}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={label}>CVV</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="•••"
                                value={cvv}
                                onChange={(e) => setCvv(soloDigitos(e.target.value).slice(0, 4))}
                                disabled={procesando}
                                style={input}
                            />
                        </div>
                    </div>

                    {/* Ayuda para la demostración */}
                    <div style={{
                        backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                        padding: '10px 12px', fontSize: '0.75rem', color: '#7f1d1d', marginBottom: '14px', lineHeight: 1.5
                    }}>
                        <strong>Tarjetas de prueba</strong> (cualquier titular, vencimiento futuro y CVV):<br />
                        Aprobada: <strong>4242 4242 4242 4242</strong><br />
                        Rechazada: <strong>4000 0000 0000 0002</strong>
                    </div>

                    {error && (
                        <p style={{ color: ROJO, fontSize: '0.85rem', fontWeight: '600', margin: '0 0 14px' }}>{error}</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={procesando}
                            style={{
                                padding: '10px 20px', borderRadius: '20px', border: '1px solid #cbd5e1',
                                backgroundColor: '#fff', fontWeight: '700', fontSize: '0.85rem',
                                cursor: procesando ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={procesando}
                            style={{
                                padding: '10px 22px', borderRadius: '20px', border: 'none', backgroundColor: ROJO,
                                color: '#fff', fontWeight: '700', fontSize: '0.85rem',
                                cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1
                            }}
                        >
                            {procesando ? 'Procesando pago...' : `Pagar ${formatearPrecio(total)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PagoModal;