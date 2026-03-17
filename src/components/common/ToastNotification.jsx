import React, { useEffect } from 'react';

const ToastNotification = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px',
            zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px',
            pointerEvents: 'none'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

const Toast = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => removeToast(toast.id), toast.duration || 3000);
        return () => clearTimeout(timer);
    }, []);

    const configs = {
        success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d', symbol: '✓' },
        error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#b91c1c', symbol: '✕' },
        warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#b45309', symbol: '⚠' },
        info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1d4ed8', symbol: 'ℹ' },
    };
    const c = configs[toast.type] || configs.success;

    return (
        <div
            style={{
                pointerEvents: 'all',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: c.bg, border: `1.5px solid ${c.border}`,
                borderRadius: '12px', padding: '14px 16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                minWidth: '300px', maxWidth: '400px',
                fontFamily: "'Inter', sans-serif",
                animation: 'toast-in 0.25s ease',
            }}
        >
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* Icon */}
            <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: c.icon, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px'
            }}>
                {c.symbol}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                {toast.title && (
                    <div style={{ fontSize: '14px', fontWeight: 600, color: c.text, marginBottom: '2px' }}>
                        {toast.title}
                    </div>
                )}
                <div style={{ fontSize: '13px', color: c.text, opacity: 0.85, lineHeight: '1.5' }}>
                    {toast.message}
                </div>
            </div>

            {/* Close */}
            <button
                onClick={() => removeToast(toast.id)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: c.icon, opacity: 0.6, fontSize: '16px',
                    padding: '0', lineHeight: 1, flexShrink: 0
                }}
            >×</button>
        </div>
    );
};

export default ToastNotification;