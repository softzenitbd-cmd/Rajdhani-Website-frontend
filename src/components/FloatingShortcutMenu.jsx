import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, PlusCircle } from 'lucide-react';
import { readShortcuts, loadShortcuts, SHORTCUT_EVENT } from '../utils/shortcuts';

/**
 * Floating Action Button (FAB) + Quick Menu popup on all screens.
 * Supports bilingual translation (English & Bangla) in real-time.
 */
const FloatingShortcutMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(readShortcuts);
  const menuRef = useRef(null);

  useEffect(() => {
    const sync = () => setShortcuts(readShortcuts());
    window.addEventListener(SHORTCUT_EVENT, sync);
    loadShortcuts().then(setShortcuts);
    return () => window.removeEventListener(SHORTCUT_EVENT, sync);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div ref={menuRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Floating Shortcut Popup Card */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '65px',
          right: 0,
          width: '240px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {/* Top fixed action: Add Shortcut */}
          <div
            onClick={() => handleNavigate('/settings/shortcut-menu')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              color: '#0f172a',
              transition: 'all 0.15s ease',
              borderBottom: '1px solid #f1f5f9'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f0fdf4';
              e.currentTarget.style.color = '#16a34a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#0f172a';
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <PlusCircle size={16} />
            </div>
            <span>{t('header.add_shortcut', 'শর্টকাট যুক্ত করুন')}</span>
          </div>

          {/* Dynamic Shortcuts List */}
          {shortcuts.map((item) => {
            const label = item.labelKey ? t(item.labelKey, item.title) : t(item.title);
            return (
              <div
                key={item.id || item.path}
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#16a34a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <PlusCircle size={16} />
                </div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("Quick Actions Menu")}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4), 0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
        onMouseOver={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseOut={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default FloatingShortcutMenu;
