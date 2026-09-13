import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import '../components/Toast.css';

const ToastContext = createContext();

// Hook-free bridge so plain JS modules (utils/services) can show toasts.
// The provider registers its addToast here on mount.
let externalAddToast = null;
export const toast = {
  success: (message, duration) => externalAddToast?.(message, 'success', duration),
  error: (message, duration) => externalAddToast?.(message, 'error', duration),
  info: (message, duration) => externalAddToast?.(message, 'info', duration),
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    // Auto remove after duration + animation time
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    // Add hiding class to trigger exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hiding: true } : t))
    );
    
    // Remove from DOM after exit animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400); // 400ms matches slideOutRight animation
  }, []);

  useEffect(() => {
    externalAddToast = addToast;
    return () => { externalAddToast = null; };
  }, [addToast]);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.hiding ? 'hiding' : ''}`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle size={24} />}
              {t.type === 'error' && <XCircle size={24} />}
              {t.type === 'info' && <Info size={24} />}
            </div>
            <p className="toast-message">{t.message}</p>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <X size={18} />
            </button>
            <div className="toast-progress">
              <div 
                className="toast-progress-bar" 
                style={{ animationDuration: `${t.duration}ms` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
