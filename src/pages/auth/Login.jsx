import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, ArrowRight, Eye, EyeOff, 
  ShieldCheck, Sparkles, Layers, Activity 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Clear any existing expired/invalid tokens when visiting login page
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Import apiClient and ENDPOINTS at the top of the file
      const { default: apiClient } = await import('../../api/apiClient');
      const { ENDPOINTS } = await import('../../api/endpoints');
      
      const response = await apiClient.post(ENDPOINTS.AUTH_LOGIN, {
        username: email, // The UI has an email/username field, sending as username to backend
        password: password
      });
      
      if (response.access) {
        localStorage.setItem('token', response.access);
        if (response.refresh) {
          localStorage.setItem('refresh_token', response.refresh);
        }
        
        // Save user details for later use
        if (response.custom_permissions) {
          localStorage.setItem('custom_permissions', JSON.stringify(response.custom_permissions));
        }
        if (response.role) localStorage.setItem('role', response.role);
        if (response.username) localStorage.setItem('username', response.username);
        if (response.full_name) localStorage.setItem('full_name', response.full_name);
        
        navigate(location.state?.from || '/dashboard', { replace: true });
      } else {
        setErrorMessage(t("Login failed, no token received"));
      }
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMessage(err?.message || t("Invalid credentials or server error"));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="rg-login-container">
      {/* LEFT SHOWCASE PANEL (Desktop & Tablet) */}
      <div className="rg-showcase-panel">
        <div className="rg-showcase-bg" />
        <div className="rg-showcase-overlay" />
        
        {/* Subtle Decorative Lights */}
        <div className="rg-glow-orb rg-glow-top" />
        <div className="rg-glow-orb rg-glow-bottom" />

        <div className="rg-showcase-content">
          {/* Brand Emblem */}
          <div className="rg-brand-badge">
            <div className="rg-brand-crest">
              <span className="rg-brand-letters">{t("RG")}</span>
            </div>
            <div>
              <div className="rg-brand-eyebrow">{t("PREMIER APPAREL ERP")}</div>
              <h1 className="rg-brand-title">
                {t("Rajdhani Garments")}
              </h1>
              <p className="rg-brand-subtitle-bn">রাজধানী গার্মেন্টস লিমিটেড</p>
            </div>
          </div>

          {/* Tagline & Description */}
          <div className="rg-showcase-body">
            <h2 className="rg-showcase-heading">
              {t("Next-Gen Enterprise Apparel & Retail Management")}
            </h2>
            <p className="rg-showcase-desc">
              {t("Comprehensive cloud ERP for modern garment manufacturers, wholesalers, and retail chains. Seamlessly orchestrate inventory, supply chains, invoicing, and staff payroll in real time.")}
            </p>

            {/* Key Pillars */}
            <div className="rg-features-grid">
              <div className="rg-feature-item">
                <div className="rg-feature-icon">
                  <Layers size={20} />
                </div>
                <div>
                  <h4 className="rg-feature-title">{t("Production & Stock Sync")}</h4>
                  <p className="rg-feature-text">{t("Real-time tracking of fabric, cuts, and finished stock.")}</p>
                </div>
              </div>

              <div className="rg-feature-item">
                <div className="rg-feature-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="rg-feature-title">{t("Smart Barcode & POS")}</h4>
                  <p className="rg-feature-text">{t("Lightning-fast billing with thermal & full-sheet printing.")}</p>
                </div>
              </div>

              <div className="rg-feature-item">
                <div className="rg-feature-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="rg-feature-title">{t("Financial & Audit Guard")}</h4>
                  <p className="rg-feature-text">{t("Granular ledger, client credit, and supplier schedules.")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live System Status */}
          <div className="rg-system-status">
            <div className="rg-status-dot-wrap">
              <span className="rg-status-dot" />
              <span className="rg-status-ping" />
            </div>
            <span>{t("Cloud Server Live • Rajdhani Garments ERP v2.6 Enterprise Edition")}</span>
          </div>
        </div>
      </div>

      {/* RIGHT AUTHENTICATION PANEL */}
      <div className="rg-auth-panel">
        <div className="rg-auth-card">
          {/* Header Mobile Brand */}
          <div className="rg-mobile-brand">
            <div className="rg-brand-crest rg-crest-small">
              <span className="rg-brand-letters">{t("RG")}</span>
            </div>
            <div>
              <h2 className="rg-mobile-title">{t("Rajdhani Garments")}</h2>
              <span className="rg-mobile-sub">রাজধানী গার্মেন্টস</span>
            </div>
          </div>

          {/* Header */}
          <div className="rg-form-header">
            <div className="rg-badge-pill">
              <Activity size={14} className="rg-badge-icon" />
              <span>{t("Administrative Portal")}</span>
            </div>
            <h2 className="rg-welcome-heading">{t("Welcome Back")}</h2>
            <p className="rg-welcome-sub">
              {t("Please enter your authorized credentials to access your terminal.")}
            </p>
          </div>


          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="rg-form">
            {/* Email Field */}
            <div className="rg-field-group">
              <label className="rg-field-label" htmlFor="rg-email">
                {t("Email or Staff ID")} <span className="rg-required">*</span>
              </label>
              <div className={`rg-input-box ${focusedInput === 'email' ? 'focused' : ''}`}>
                <div className="rg-input-icon">
                  <Mail size={19} />
                </div>
                <input
                  id="rg-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder={t("name@rajdhanigarments.com")}
                  required
                  className="rg-native-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="rg-field-group">
              <div className="rg-field-label-row">
                <label className="rg-field-label" htmlFor="rg-password">
                  {t("Password")} <span className="rg-required">*</span>
                </label>
                <a href="#forgot" className="rg-link" onClick={(e) => e.preventDefault()}>
                  {t("Forgot password?")}
                </a>
              </div>
              <div className={`rg-input-box ${focusedInput === 'password' ? 'focused' : ''}`}>
                <div className="rg-input-icon">
                  <Lock size={19} />
                </div>
                <input
                  id="rg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder={t("Enter your password")}
                  required
                  className="rg-native-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rg-eye-btn"
                  title={showPassword ? t("Hide password") : t("Show password")}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="rg-form-options">
              <label className="rg-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rg-checkbox"
                />
                <span className="rg-checkbox-text">{t("Keep me signed in for 30 days")}</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`rg-submit-btn ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <div className="rg-spinner-row">
                  <span className="rg-btn-spinner" />
                  <span>{t("Authenticating...")}</span>
                </div>
              ) : (
                <>
                  <span>{t("Sign In to Terminal")}</span>
                  <ArrowRight size={18} className="rg-btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Security & System Footer */}
          <div className="rg-auth-footer">
            <div className="rg-security-badge">
              <ShieldCheck size={14} color="#059669" />
              <span>{t("256-Bit SSL Encrypted Enterprise System")}</span>
            </div>
            <p className="rg-copyright">
              &copy; {new Date().getFullYear()} <strong>{t("Rajdhani Garments BD")}</strong>{t(". All rights reserved.")}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .rg-login-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          background-color: #0c1322;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* LEFT SHOWCASE PANEL */
        .rg-showcase-panel {
          flex: 1.15;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 56px 64px;
          overflow: hidden;
          color: #ffffff;
        }

        .rg-showcase-bg {
          position: absolute;
          inset: 0;
          background-image: url('/garments_hero.jpg');
          background-size: cover;
          background-position: center;
          filter: brightness(0.78) contrast(1.1);
          transform: scale(1.03);
          transition: transform 12s ease-out;
        }

        .rg-showcase-panel:hover .rg-showcase-bg {
          transform: scale(1.08);
        }

        .rg-showcase-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(10, 17, 34, 0.93) 0%,
            rgba(15, 23, 42, 0.82) 50%,
            rgba(26, 16, 56, 0.88) 100%
          );
          backdrop-filter: blur(4px);
        }

        .rg-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }

        .rg-glow-top {
          width: 380px;
          height: 380px;
          top: -60px;
          left: -40px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%);
        }

        .rg-glow-bottom {
          width: 440px;
          height: 440px;
          bottom: -80px;
          right: -40px;
          background: radial-gradient(circle, rgba(217, 119, 6, 0.28) 0%, rgba(217, 119, 6, 0) 70%);
        }

        .rg-showcase-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* BRAND CREST */
        .rg-brand-badge {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .rg-brand-crest {
          width: 58px;
          height: 58px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid #f59e0b;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -4px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          position: relative;
        }

        .rg-brand-letters {
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #fbbf24 0%, #fef08a 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rg-crest-small {
          width: 44px;
          height: 44px;
          border-radius: 12px;
        }

        .rg-crest-small .rg-brand-letters {
          font-size: 20px;
        }

        .rg-brand-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #f59e0b;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .rg-brand-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0;
          color: #ffffff;
        }

        .rg-brand-subtitle-bn {
          font-size: 14px;
          color: #94a3b8;
          margin: 2px 0 0;
          font-weight: 500;
        }

        /* BODY & FEATURES */
        .rg-showcase-body {
          margin: 48px 0;
          max-width: 580px;
        }

        .rg-showcase-heading {
          font-size: 34px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.6px;
          color: #f8fafc;
          margin: 0 0 18px;
          background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rg-showcase-desc {
          font-size: 15px;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0 0 32px;
        }

        .rg-features-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rg-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 14px 18px;
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }

        .rg-feature-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(245, 158, 11, 0.3);
          transform: translateX(4px);
        }

        .rg-feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(59, 130, 246, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fbbf24;
          flex-shrink: 0;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .rg-feature-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px;
        }

        .rg-feature-text {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.4;
        }

        .rg-system-status {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 30px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 12px;
          color: #cbd5e1;
          width: fit-content;
        }

        .rg-status-dot-wrap {
          position: relative;
          width: 10px;
          height: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rg-status-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
        }

        .rg-status-ping {
          position: absolute;
          inset: -2px;
          background-color: #10b981;
          border-radius: 50%;
          opacity: 0.75;
          animation: rg-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes rg-ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* RIGHT AUTH PANEL */
        .rg-auth-panel {
          flex: 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #0f172a;
          position: relative;
          z-index: 2;
        }

        .rg-auth-card {
          width: 100%;
          maxWidth: 460px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 44px 40px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .rg-mobile-brand {
          display: none;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rg-mobile-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .rg-mobile-sub {
          font-size: 13px;
          color: #64748b;
        }

        .rg-form-header {
          margin-bottom: 24px;
        }

        .rg-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
          border: 1px solid #dbeafe;
        }

        .rg-welcome-heading {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0 0 6px;
        }

        .rg-welcome-sub {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* DEMO PILL */
        .rg-demo-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f0fdf4;
          border: 1px dashed #86efac;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rg-demo-pill:hover {
          background: #dcfce7;
          border-color: #4ade80;
          transform: translateY(-1px);
        }

        .rg-demo-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #15803d;
        }

        .rg-demo-text {
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #166534;
          font-weight: 600;
        }

        /* FORM */
        .rg-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .rg-field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .rg-field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rg-field-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .rg-required {
          color: #ef4444;
          font-weight: bold;
        }

        .rg-link {
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.2s;
        }

        .rg-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .rg-input-box {
          display: flex;
          align-items: center;
          position: relative;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .rg-input-box.focused {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .rg-input-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 14px;
          padding-right: 4px;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .rg-input-box.focused .rg-input-icon {
          color: #2563eb;
        }

        .rg-native-input {
          flex: 1;
          width: 100%;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          padding: 14px 12px !important;
          font-size: 14px !important;
          color: #0f172a !important;
          font-family: inherit;
          margin: 0 !important;
          box-shadow: none !important;
        }

        .rg-native-input::placeholder {
          color: #94a3b8;
          font-size: 14px;
        }

        .rg-eye-btn {
          background: transparent;
          border: none;
          padding: 8px 14px;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .rg-eye-btn:hover {
          color: #334155;
        }

        .rg-form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -4px;
        }

        .rg-checkbox-label {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          user-select: none;
        }

        .rg-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #2563eb;
          cursor: pointer;
          border-radius: 4px;
        }

        .rg-checkbox-text {
          font-size: 13px;
          color: #475569;
          font-weight: 500;
        }

        /* SUBMIT BUTTON */
        .rg-submit-btn {
          width: 100%;
          padding: 14px 20px;
          margin-top: 6px;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .rg-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(37, 99, 235, 0.55);
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #4338ca 100%);
        }

        .rg-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .rg-submit-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .rg-btn-arrow {
          transition: transform 0.2s ease;
        }

        .rg-submit-btn:hover .rg-btn-arrow {
          transform: translateX(4px);
        }

        .rg-spinner-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rg-btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: rg-spin 0.8s linear infinite;
        }

        @keyframes rg-spin {
          100% {
            transform: rotate(360deg);
          }
        }

        /* FOOTER */
        .rg-auth-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .rg-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #059669;
          background: #f0fdf4;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid #dcfce7;
        }

        .rg-copyright {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        /* RESPONSIVE DESIGN */
        @media (max-width: 1080px) {
          .rg-showcase-panel {
            padding: 40px;
          }
          .rg-showcase-heading {
            font-size: 28px;
          }
        }

        @media (max-width: 900px) {
          .rg-login-container {
            flex-direction: column;
          }
          .rg-showcase-panel {
            display: none;
          }
          .rg-auth-panel {
            flex: 1;
            padding: 24px 16px;
            background: linear-gradient(135deg, #0c1322 0%, #1e293b 100%);
          }
          .rg-auth-card {
            padding: 32px 24px;
          }
          .rg-mobile-brand {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
