import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const showError = useCallback((msg, duration) => addToast(msg, 'error', duration || 4500), [addToast]);
  const showWarning = useCallback((msg, duration) => addToast(msg, 'warning', duration || 4000), [addToast]);
  const showInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          let Icon = Info;
          if (toast.type === 'success') Icon = CheckCircle2;
          else if (toast.type === 'error') Icon = XCircle;
          else if (toast.type === 'warning') Icon = AlertTriangle;

          return (
            <div key={toast.id} className={`toast-item toast-${toast.type} animate-toast-slide`}>
              <div className="toast-icon">
                <Icon size={18} />
              </div>
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showSuccess: (msg) => console.log('Toast (success):', msg),
      showError: (msg) => console.error('Toast (error):', msg),
      showWarning: (msg) => console.warn('Toast (warning):', msg),
      showInfo: (msg) => console.info('Toast (info):', msg),
      addToast: (msg) => console.log('Toast:', msg),
      removeToast: () => {}
    };
  }
  return context;
};
