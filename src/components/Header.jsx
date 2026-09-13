import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Calculator, PlusCircle, User, Lock, Shield, UserPlus, Settings, Pin, Building, Server, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forceLogout } from '../api/apiClient';
import { readShortcuts, loadShortcuts, SHORTCUT_EVENT } from '../utils/shortcuts';
import { companyStore } from '../services/companyStore';

// Small pop-up calculator used from the header
const CalculatorPopup = ({ onClose }) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');

  const evaluate = () => {
    try {
      if (!/^[\d+\-*/().%\s]+$/.test(expr)) throw new Error('bad');
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${expr.replace(/%/g, '/100')})`)();
      setResult(Number.isFinite(val) ? String(+val.toFixed(4)) : 'Error');
    } catch {
      setResult('Error');
    }
  };

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '%', '+'];

  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '240px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', padding: '12px', zIndex: 100, color: '#1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ fontSize: '13px' }}>Calculator</strong>
        <X size={16} style={{ cursor: 'pointer' }} onClick={onClose} />
      </div>
      <input
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && evaluate()}
        placeholder="0"
        style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'right', fontSize: '16px', marginBottom: '4px' }}
      />
      <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', minHeight: '24px', marginBottom: '8px', color: '#4f46e5' }}>{result}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {keys.map((k) => (
          <button key={k} onClick={() => setExpr((p) => p + k)} style={{ padding: '8px 0', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer' }}>{k}</button>
        ))}
        <button onClick={() => { setExpr(''); setResult(''); }} style={{ gridColumn: 'span 2', padding: '8px 0', border: 'none', background: '#ef4444', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>C</button>
        <button onClick={evaluate} style={{ gridColumn: 'span 2', padding: '8px 0', border: 'none', background: '#4f46e5', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>=</button>
      </div>
    </div>
  );
};

const Header = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const profileRef = useRef(null);
  const calcRef = useRef(null);

  const username = localStorage.getItem('username') || 'User';
  const fullName = localStorage.getItem('full_name') || username;
  const role = (localStorage.getItem('role') || '').toUpperCase();
  const [avatar, setAvatar] = useState(() => localStorage.getItem('profile_image') || '');
  const [companyName, setCompanyName] = useState(() => companyStore.getCached().company_name || '');

  useEffect(() => {
    const sync = () => setAvatar(localStorage.getItem('profile_image') || '');
    window.addEventListener('profileUpdated', sync);
    window.addEventListener('storage', sync);
    const syncCompany = () => setCompanyName(companyStore.getCached().company_name || '');
    window.addEventListener(companyStore.EVENT, syncCompany);
    companyStore.load().then(syncCompany);
    return () => {
      window.removeEventListener('profileUpdated', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener(companyStore.EVENT, syncCompany);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (calcRef.current && !calcRef.current.contains(event.target)) {
        setCalcOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Quick buttons are user configurable from Settings → Shortcut Menu
  const [shortcuts, setShortcuts] = useState(readShortcuts);
  useEffect(() => {
    const sync = () => setShortcuts(readShortcuts());
    window.addEventListener(SHORTCUT_EVENT, sync);
    loadShortcuts().then(setShortcuts);
    return () => window.removeEventListener(SHORTCUT_EVENT, sync);
  }, []);
  const navButtons = shortcuts.map((s) => ({ label: s.labelKey ? t(s.labelKey) : s.title, icon: <PlusCircle size={14} />, path: s.path }));

  const profileMenu = [
    { label: t('header.my_profile'), icon: <User size={16} />, path: '/profile' },
    { label: t('header.change_password'), icon: <Lock size={16} />, path: '/profile', state: { tab: 'password' } },
    { label: t('header.role'), icon: <Shield size={16} />, path: '/settings/users', state: { tab: 'permissions' } },
    { label: t('header.add_user'), icon: <UserPlus size={16} />, path: '/settings/users', state: { openCreate: true } },
    { label: t('header.settings'), icon: <Settings size={16} />, path: '/settings/settings' },
    { label: t('header.shortcut_menu'), icon: <Pin size={16} />, path: '/settings/shortcut-menu' },
    { label: t('header.company_info'), icon: <Building size={16} />, path: '/settings/company-information' },
    { label: t('header.server_info'), icon: <Server size={16} />, path: '/support' },
    { label: t('menu.sign_out'), icon: <LogOut size={16} />, action: 'logout' }
  ];

  const handleMenuClick = (item) => {
    setProfileOpen(false);
    if (item.action === 'logout') {
      forceLogout();
      return;
    }
    if (item.path) navigate(item.path, { state: item.state });
  };

  const avatarNode = (size) => (
    avatar ? (
      <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e7ff', color: '#4338ca', fontWeight: 'bold', fontSize: size }}>
        {(fullName || 'U').charAt(0).toUpperCase()}
      </div>
    )
  );

  return (
    <header 
      className="header" 
      style={{ 
        background: 'linear-gradient(90deg, #c026d3 0%, #a855f7 40%, #6366f1 100%)',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        minHeight: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '12px'
      }}
    >
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Menu className="mobile-menu-btn" size={24} style={{ cursor: 'pointer' }} onClick={toggleSidebar} />
        <span style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{companyName || t('app_name')}</span>
      </div>
      
      <div className="header-nav-scroll" style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '6px', 
        alignItems: 'center',
        flex: 1, 
        overflowX: 'auto',
        padding: '8px 0',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {navButtons.map((btn, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(btn.path)}
            style={{ 
              background: '#14b8a6', // teal
              color: 'white', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button 
          onClick={toggleLanguage}
          style={{ 
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.5)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
            <span>A</span>
            <span style={{ fontSize: '10px' }}>文</span>
          </div>
          {t('header.switch_lang')}
        </button>
        <div style={{ position: 'relative' }} ref={calcRef}>
        <button 
          onClick={() => setCalcOpen(!calcOpen)}
          style={{ 
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.5)',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Calculator size={16} />
        </button>
        {calcOpen && <CalculatorPopup onClose={() => setCalcOpen(false)} />}
        </div>
        
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.3)',
              cursor: 'pointer'
            }}>
            {avatarNode('16px')}
          </div>

          {profileOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '15px',
              width: '240px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 100
            }}>
              {/* Dropdown Header Arrow */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '12px',
                width: '16px',
                height: '16px',
                background: '#6b46c1',
                transform: 'rotate(45deg)'
              }} />

              {/* Dropdown Header */}
              <div style={{
                background: 'linear-gradient(135deg, #6b46c1 0%, #4c1d95 100%)',
                color: 'white',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'white',
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.8)',
                  marginBottom: '10px'
                }}>
                  {avatarNode('16px')}
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{fullName}</h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>{role || username.toUpperCase()}</p>
                
                {/* Status Dot */}
                <div style={{
                  position: 'absolute',
                  bottom: '65px',
                  right: '85px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid white'
                }} />
              </div>

              {/* Dropdown Menu */}
              <div style={{ padding: '8px 0', color: '#333', maxHeight: '350px', overflowY: 'auto' }}>
                {profileMenu.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderBottom: idx < profileMenu.length - 1 ? '1px dashed #eaeaea' : 'none',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                  onClick={() => handleMenuClick(item)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.color = '#4f46e5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#333';
                  }}
                  >
                    <div style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

