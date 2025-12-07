import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return {
                bg: 'bg-gradient-to-r from-green-600/95 to-emerald-600/95',
                border: 'border-green-400/50',
                icon: '✅',
                glow: 'shadow-green-500/30'
            };
        case 'error':
            return {
                bg: 'bg-gradient-to-r from-red-600/95 to-rose-600/95',
                border: 'border-red-400/50',
                icon: '❌',
                glow: 'shadow-red-500/30'
            };
        case 'warning':
            return {
                bg: 'bg-gradient-to-r from-yellow-600/95 to-amber-600/95',
                border: 'border-yellow-400/50',
                icon: '⚠️',
                glow: 'shadow-yellow-500/30'
            };
        case 'info':
            return {
                bg: 'bg-gradient-to-r from-blue-600/95 to-indigo-600/95',
                border: 'border-blue-400/50',
                icon: 'ℹ️',
                glow: 'shadow-blue-500/30'
            };
    }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    const success = useCallback((message: string, duration?: number) => showToast(message, 'success', duration), [showToast]);
    const error = useCallback((message: string, duration?: number) => showToast(message, 'error', duration), [showToast]);
    const warning = useCallback((message: string, duration?: number) => showToast(message, 'warning', duration), [showToast]);
    const info = useCallback((message: string, duration?: number) => showToast(message, 'info', duration), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast, index) => {
                    const styles = getToastStyles(toast.type);

                    return (
                        <div
                            key={toast.id}
                            className={`
                                pointer-events-auto
                                ${styles.bg} ${styles.border}
                                backdrop-blur-xl border rounded-xl
                                px-5 py-4 min-w-[300px] max-w-[450px]
                                shadow-2xl ${styles.glow}
                                flex items-center gap-3
                                animate-slide-in-right
                                cursor-pointer
                                hover:scale-[1.02] transition-transform duration-200
                            `}
                            style={{
                                animation: 'slideInRight 0.4s ease-out forwards',
                            }}
                            onClick={() => removeToast(toast.id)}
                        >
                            <span className="text-2xl">{styles.icon}</span>
                            <p className="text-white font-medium text-sm flex-1">{toast.message}</p>
                            <button
                                className="text-white/60 hover:text-white text-lg font-bold transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(toast.id);
                                }}
                            >
                                ×
                            </button>

                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
                                <div
                                    className="h-full bg-white/40"
                                    style={{
                                        animation: `shrink ${toast.duration}ms linear forwards`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Styles */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
