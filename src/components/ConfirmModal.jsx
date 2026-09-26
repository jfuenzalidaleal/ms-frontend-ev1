import React, { useState, useEffect } from 'react';

/**
 * Modal de confirmación reutilizable.
 *
 * Props:
 *  - titulo: texto del encabezado
 *  - mensaje: texto explicativo
 *  - textoConfirmar: texto del botón de confirmación (por defecto "Sí, continuar")
 *  - textoCancelar: texto del botón para volver (por defecto "No, volver")
 *  - onConfirm: función (puede ser async) que se ejecuta al confirmar
 *  - onClose: función que cierra el modal sin hacer nada
 */
export function ConfirmModal({
                                 titulo,
                                 mensaje,
                                 textoConfirmar = 'Sí, continuar',
                                 textoCancelar = 'No, volver',
                                 onConfirm,
                                 onClose
                             }) {
    const [procesando, setProcesando] = useState(false);

    // Cerrar con la tecla Escape (si no se está procesando)
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && !procesando) onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [procesando, onClose]);

    const handleConfirmar = async () => {
        setProcesando(true);
        try {
            await onConfirm();
        } finally {
            setProcesando(false);
            onClose();
        }
    };

    return (
        <div
            onClick={() => !procesando && onClose()}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 200
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-titulo"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff', borderRadius: '16px', padding: '30px',
                    width: '400px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fef2f2',
                    color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px'
                }}>
                    !
                </div>

                <h3 id="confirm-modal-titulo" style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                    {titulo}
                </h3>

                <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                    {mensaje}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={procesando}
                        autoFocus
                        style={{
                            padding: '10px 20px', borderRadius: '20px', border: '1px solid #e2e8f0',
                            backgroundColor: '#fff', fontWeight: '700', fontSize: '0.85rem',
                            cursor: procesando ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {textoCancelar}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={procesando}
                        style={{
                            padding: '10px 20px', borderRadius: '20px', border: 'none',
                            backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '0.85rem',
                            cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1
                        }}
                    >
                        {procesando ? 'Procesando...' : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;