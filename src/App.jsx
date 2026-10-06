import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FloatingShortcutMenu from './components/FloatingShortcutMenu';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CrmRoutes = lazy(() => import('./routes/CrmRoutes'));
const AccountRoutes = lazy(() => import('./routes/AccountRoutes'));
const LoanRoutes = lazy(() => import('./routes/LoanRoutes'));
const InvoiceRoutes = lazy(() => import('./routes/InvoiceRoutes'));
const ProductRoutes = lazy(() => import('./routes/ProductRoutes'));
const SmsRoutes = lazy(() => import('./routes/SmsRoutes'));
const StaffRoutes = lazy(() => import('./routes/StaffRoutes'));
const DueReportRoutes = lazy(() => import('./routes/DueReportRoutes'));
const SalesReportRoutes = lazy(() => import('./routes/SalesReportRoutes'));
const DepositReportRoutes = lazy(() => import('./routes/DepositReportRoutes'));
const ExpenseReportRoutes = lazy(() => import('./routes/ExpenseReportRoutes'));
const SettingsRoutes = lazy(() => import('./routes/SettingsRoutes'));
const SupportDashboard = lazy(() => import('./pages/support/SupportDashboard'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Login = lazy(() => import('./pages/auth/Login'));
import { LoaderProvider, useLoader } from './context/LoaderContext';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RouteChangeListener = () => {
  const location = useLocation();
  const { showLoader, hideLoader } = useLoader();

  React.useEffect(() => {
    showLoader('Loading...');
    const timer = setTimeout(() => {
      hideLoader();
    }, 400); // 400ms premium feel

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};

const AppContent = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Global listener: Auto-open calendar picker on click/focus for ALL date fields across entire app
  React.useEffect(() => {
    const handleGlobalDatePicker = (e) => {
      const target = e.target;
      if (target && target.tagName === 'INPUT' && target.type === 'date') {
        try {
          if (typeof target.showPicker === 'function') {
            target.showPicker();
          }
        } catch (err) {
          // Ignore if already open or not supported
        }
      }
    };

    document.addEventListener('click', handleGlobalDatePicker);
    document.addEventListener('focusin', handleGlobalDatePicker);

    return () => {
      document.removeEventListener('click', handleGlobalDatePicker);
      document.removeEventListener('focusin', handleGlobalDatePicker);
    };
  }, []);

  // Auto close sidebar whenever route/pathname changes
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isAuthenticated = !!localStorage.getItem('token');

  if (location.pathname === '/login') {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return (
      <Routes>
        <Route path="/login" element={<Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'50px'}}>Loading...</div>}><Login /></Suspense>} />
      </Routes>
    );
  }

  // Every other route requires a logged in user
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} closeSidebar={closeSidebar} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <FloatingShortcutMenu />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <main className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ flex: '1 0 auto', paddingBottom: '20px' }}>
          <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'50px'}}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* All CRM related routes are handled inside CrmRoutes */}
              <Route path="/crm/*" element={<CrmRoutes />} />
              
              {/* Account Routes */}
              <Route path="/account/*" element={<AccountRoutes />} />
              
              {/* Loan Routes */}
              <Route path="/loan/*" element={<LoanRoutes />} />
              
              {/* Invoice Routes */}
              <Route path="/invoice/*" element={<InvoiceRoutes />} />
              
              {/* Product Routes */}
              <Route path="/product/*" element={<ProductRoutes />} />
              
              {/* SMS Routes */}
              <Route path="/sms/*" element={<SmsRoutes />} />
              
              {/* Staff Routes */}
              <Route path="/staff/*" element={<StaffRoutes />} />
              
              {/* Due Report Routes */}
              <Route path="/due-report/*" element={<DueReportRoutes />} />
              
              {/* Sales Report Routes */}
              <Route path="/sales-report/*" element={<SalesReportRoutes />} />

              {/* Deposit Report Routes */}
              <Route path="/deposit-report/*" element={<DepositReportRoutes />} />

              {/* Expense Report Routes */}
              <Route path="/expense-report/*" element={<ExpenseReportRoutes />} />

              {/* Settings Routes */}
              <Route path="/settings/*" element={<SettingsRoutes />} />
              
              {/* Support Route */}
              <Route path="/support" element={<SupportDashboard />} />
              
              {/* Profile Route */}
              <Route path="/profile" element={<Profile />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
        <footer style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: 'var(--fs-13, 13px)', flexShrink: 0 }}>
          {t("Copyright © 2026 Softzen IT. All rights reserved.")}
        </footer>
      </main>
    </div>
  );
};

function App() {
  return (
    <LoaderProvider>
      <BrowserRouter>
        <RouteChangeListener />
        <AppContent />
      </BrowserRouter>
    </LoaderProvider>
  );
}

export default App;
