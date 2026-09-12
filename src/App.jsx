import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CrmRoutes from './routes/CrmRoutes';
import AccountRoutes from './routes/AccountRoutes';
import LoanRoutes from './routes/LoanRoutes';
import InvoiceRoutes from './routes/InvoiceRoutes';
import ProductRoutes from './routes/ProductRoutes';
import SmsRoutes from './routes/SmsRoutes';
import StaffRoutes from './routes/StaffRoutes';
import DueReportRoutes from './routes/DueReportRoutes';
import SalesReportRoutes from './routes/SalesReportRoutes';
import DepositReportRoutes from './routes/DepositReportRoutes';
import ExpenseReportRoutes from './routes/ExpenseReportRoutes';
import SettingsRoutes from "./routes/SettingsRoutes";
import SupportDashboard from "./pages/support/SupportDashboard";
import Profile from './pages/profile/Profile';
import Login from './pages/auth/Login';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import { useLocation } from 'react-router-dom';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isAuthenticated = !!localStorage.getItem('token');

  if (location.pathname === '/login') {
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Every other route requires a logged in user
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <main className="main-wrapper">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ flex: '1 0 auto', paddingBottom: '20px' }}>
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
        </div>
        <footer style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '13px', flexShrink: 0 }}>
          Copyright © 2026 Softzen IT. All rights reserved.
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
