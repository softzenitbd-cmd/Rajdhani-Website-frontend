import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, HelpCircle, Info, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      
      let config = {
        title: 'Confirmation Needed',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger', // 'danger' | 'warning' | 'info'
      };

      if (typeof options === 'string') {
        config.message = options;
        if (options.toLowerCase().includes('delete') || options.toLowerCase().includes('deactivate') || options.toLowerCase().includes('cancel')) {
          config.variant = 'danger';
        } else {
          config.variant = 'warning';
        }
      } else if (options && typeof options === 'object') {
        config = { ...config, ...options };
      }

      setModalState(config);
    });
  }, []);

  const handleClose = (result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setModalState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {modalState && (
        <ConfirmModalUI config={modalState} onClose={handleClose} />
      )}
    </ConfirmContext.Provider>
  );
};

const ConfirmModalUI = ({ config, onClose }) => {
  const { title, message, confirmText, cancelText, variant } = config;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger ? '#Fee2e2' : isWarning ? '#Fef3c7' : '#E0f2fe';
  const iconColor = isDanger ? '#Ef4444' : isWarning ? '#F59e0b' : '#0284c7';
  const confirmBtnBg = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#0f766e';
  const confirmBtnHover = isDanger ? '#dc2626' : isWarning ? '#d97706' : '#0d9488';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInOverlay 0.2s ease-out'
      }}
      onClick={() => onClose(false)}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          animation: 'scaleInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid #f1f5f9'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Body */}
        <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isDanger ? (
              <AlertTriangle size={24} />
            ) : isWarning ? (
              <AlertTriangle size={24} />
            ) : (
              <HelpCircle size={24} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>

          <button
            onClick={() => onClose(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={() => onClose(false)}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            {cancelText}
          </button>
          <button
            onClick={() => onClose(true)}
            autoFocus
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: confirmBtnBg,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = confirmBtnHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = confirmBtnBg)}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
