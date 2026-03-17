import { useState, useCallback } from 'react';

let toastId = 0;

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'success', title, message, duration = 3000 }) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Shortcut helpers
    const toast = {
        success: (message, title = 'Thành công')  => addToast({ type: 'success', title, message }),
        error:   (message, title = 'Có lỗi xảy ra') => addToast({ type: 'error',   title, message }),
        warning: (message, title = 'Cảnh báo')    => addToast({ type: 'warning', title, message }),
        info:    (message, title = 'Thông báo')   => addToast({ type: 'info',    title, message }),
    };

    return { toasts, removeToast, toast };
};

export default useToast;