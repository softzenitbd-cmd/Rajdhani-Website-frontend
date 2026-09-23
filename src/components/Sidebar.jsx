import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forceLogout } from '../api/apiClient';
import { companyStore, companyHeaderImage } from '../services/companyStore';
import { appSettingsService } from '../services/appSettingsService';
import { 
  LayoutDashboard, Users, CreditCard, Banknote, 
  FileText, Package, MessageSquare, UserCircle,
  Settings, LogOut, ChevronDown, ChevronRight, X, ShoppingCart
} from 'lucide-react';

const Sidebar = ({ isOpen, isCollapsed, closeSidebar }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'admin 2';
  const role = (localStorage.getItem('role') || 'ADMIN 2').toUpperCase();

  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());
  const [headerSettings, setHeaderSettings] = useState(() => ({
    activeCard: appSettingsService.get('print_header_card', 'card2'),
    headerMode: appSettingsService.get('print_header_mode', 'card')
  }));

  useEffect(() => {
    const syncCompany = () => setCompanyInfo({ ...companyStore.getCached() });
    const syncHeaderSettings = () => setHeaderSettings({
      activeCard: appSettingsService.get('print_header_card', 'card2'),
      headerMode: appSettingsService.get('print_header_mode', 'card')
    });

    window.addEventListener(companyStore.EVENT, syncCompany);
    window.addEventListener(appSettingsService.EVENT, syncHeaderSettings);
    companyStore.load().then(syncCompany);
    appSettingsService.load().then(syncHeaderSettings);

    return () => {
      window.removeEventListener(companyStore.EVENT, syncCompany);
      window.removeEventListener(appSettingsService.EVENT, syncHeaderSettings);
    };
  }, []);

  const [crmOpen, setCrmOpen] = useState(pathname.startsWith('/crm'));
  const [clientOpen, setClientOpen] = useState(pathname.startsWith('/crm/client') || pathname.startsWith('/crm/due-collection-date'));
  const [supplierOpen, setSupplierOpen] = useState(pathname.startsWith('/crm/supplier'));
  
  const [accountOpen, setAccountOpen] = useState(pathname.startsWith('/account'));
  const [receiveOpen, setReceiveOpen] = useState(pathname.startsWith('/account/receive'));
  const [expenseOpen, setExpenseOpen] = useState(pathname.startsWith('/account/expense') || pathname.startsWith('/account/supplier-payment') || pathname.startsWith('/account/money-return'));
  const [subAccountOpen, setSubAccountOpen] = useState(pathname.startsWith('/account/account') || pathname.startsWith('/account/statement'));
  const [transferOpen, setTransferOpen] = useState(pathname.startsWith('/account/transfer'));
  const [loanOpen, setLoanOpen] = useState(pathname.startsWith('/loan'));
  const [invoiceOpen, setInvoiceOpen] = useState(pathname.startsWith('/invoice'));
  const [salesReturnOpen, setSalesReturnOpen] = useState(pathname.startsWith('/invoice/sales-return'));
  const [productOpen, setProductOpen] = useState(pathname.startsWith('/product'));
  const [subProductOpen, setSubProductOpen] = useState(pathname.startsWith('/product') && !pathname.startsWith('/product/purchase') && !pathname.startsWith('/product/stock'));
  const [productAssetOpen, setProductAssetOpen] = useState(pathname.startsWith('/product/unit') || pathname.startsWith('/product/barcode'));
  const [purchaseOpen, setPurchaseOpen] = useState(pathname.startsWith('/product/purchase') && !pathname.startsWith('/product/purchase-return'));
  const [purchaseReturnOpen, setPurchaseReturnOpen] = useState(pathname.startsWith('/product/purchase-return'));
  const [smsOpen, setSmsOpen] = useState(pathname.startsWith('/sms'));
  const [staffOpen, setStaffOpen] = useState(pathname.startsWith('/staff'));
  const [staffPaymentOpen, setStaffPaymentOpen] = useState(pathname.startsWith('/staff/payment'));
  const [staffSalaryOpen, setStaffSalaryOpen] = useState(pathname.startsWith('/staff/salary'));
  const [staffAttendanceOpen, setStaffAttendanceOpen] = useState(pathname.startsWith('/staff/attendance'));
  const [dueReportOpen, setDueReportOpen] = useState(pathname.startsWith('/due-report'));
  const [salesReportOpen, setSalesReportOpen] = useState(pathname.startsWith('/sales-report'));
  const [depositReportOpen, setDepositReportOpen] = useState(pathname.startsWith('/deposit-report'));
  const [expenseReportOpen, setExpenseReportOpen] = useState(pathname.startsWith('/expense-report'));
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));
  const [incomeCategoryOpen, setIncomeCategoryOpen] = useState(pathname.startsWith('/settings/income-category') || pathname.startsWith('/settings/income-subcategory'));
  const [expenseCategorySettingOpen, setExpenseCategorySettingOpen] = useState(pathname.startsWith('/settings/expense-category') || pathname.startsWith('/settings/expense-subcategory'));

  useEffect(() => {
    if (pathname.startsWith('/crm')) setCrmOpen(true);
    if (pathname.startsWith('/crm/client') || pathname.startsWith('/crm/due-collection-date')) setClientOpen(true);
    if (pathname.startsWith('/crm/supplier')) setSupplierOpen(true);
    
    if (pathname.startsWith('/account')) setAccountOpen(true);
    if (pathname.startsWith('/account/receive')) setReceiveOpen(true);
    if (pathname.startsWith('/account/expense') || pathname.startsWith('/account/supplier-payment') || pathname.startsWith('/account/money-return')) setExpenseOpen(true);
    if (pathname.startsWith('/account/account') || pathname.startsWith('/account/statement')) setSubAccountOpen(true);
    if (pathname.startsWith('/account/transfer')) setTransferOpen(true);
    
    if (pathname.startsWith('/loan')) setLoanOpen(true);
    if (pathname.startsWith('/invoice')) setInvoiceOpen(true);
    if (pathname.startsWith('/invoice/sales-return')) setSalesReturnOpen(true);
    
    if (pathname.startsWith('/product')) setProductOpen(true);
    if (pathname.startsWith('/product') && !pathname.startsWith('/product/purchase') && !pathname.startsWith('/product/stock')) setSubProductOpen(true);
    if (pathname.startsWith('/product/unit') || pathname.startsWith('/product/barcode')) setProductAssetOpen(true);
    if (pathname.startsWith('/product/purchase') && !pathname.startsWith('/product/purchase-return')) setPurchaseOpen(true);
    if (pathname.startsWith('/product/purchase-return')) setPurchaseReturnOpen(true);
    
    if (pathname.startsWith('/sms')) setSmsOpen(true);
    if (pathname.startsWith('/staff')) setStaffOpen(true);
    if (pathname.startsWith('/staff/payment')) setStaffPaymentOpen(true);
    if (pathname.startsWith('/staff/salary')) setStaffSalaryOpen(true);
    if (pathname.startsWith('/staff/attendance')) setStaffAttendanceOpen(true);
    
    if (pathname.startsWith('/due-report')) setDueReportOpen(true);
    if (pathname.startsWith('/sales-report')) setSalesReportOpen(true);
    if (pathname.startsWith('/deposit-report')) setDepositReportOpen(true);
    if (pathname.startsWith('/expense-report')) setExpenseReportOpen(true);
    if (pathname.startsWith('/settings')) setSettingsOpen(true);
    if (pathname.startsWith('/settings/income-category') || pathname.startsWith('/settings/income-subcategory')) setIncomeCategoryOpen(true);
    if (pathname.startsWith('/settings/expense-category') || pathname.startsWith('/settings/expense-subcategory')) setExpenseCategorySettingOpen(true);
  }, [pathname]);

  const toggleMenu = (menu) => {
    setCrmOpen(menu === 'crm' ? !crmOpen : false);
    setAccountOpen(menu === 'account' ? !accountOpen : false);
    setLoanOpen(menu === 'loan' ? !loanOpen : false);
    setInvoiceOpen(menu === 'invoice' ? !invoiceOpen : false);
    setProductOpen(menu === 'product' ? !productOpen : false);
    setSmsOpen(menu === 'sms' ? !smsOpen : false);
    setStaffOpen(menu === 'staff' ? !staffOpen : false);
    setDueReportOpen(menu === 'dueReport' ? !dueReportOpen : false);
    setSalesReportOpen(menu === 'salesReport' ? !salesReportOpen : false);
    setDepositReportOpen(menu === 'depositReport' ? !depositReportOpen : false);
    setExpenseReportOpen(menu === 'expenseReport' ? !expenseReportOpen : false);
    setSettingsOpen(menu === 'settings' ? !settingsOpen : false);
  };

  const renderSidebarBanner = () => {
    const info = companyInfo || {};
    const headerImage = companyHeaderImage(info);
    const { activeCard, headerMode } = headerSettings;

    if (headerMode === 'image' && headerImage) {
      return (
        <img
          src={headerImage}
          alt={info.company_name || t("Header Banner")}
          style={{ maxWidth: '100%', maxHeight: '65px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
        />
      );
    }

    if (activeCard === 'card1') {
      return (
        <div style={{ textAlign: 'center', padding: '4px 8px' }}>
          <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-22, 22px)', color: 'black', fontWeight: 'bold', lineHeight: 1.1 }}>
            {info.company_name || t("Rajdhani")}
          </h2>
          <h3 style={{ fontFamily: 'cursive', margin: '-4px 0 0 20px', fontSize: 'var(--fs-14, 14px)', color: 'black' }}>
            {info.company_type || t("Garments")}
          </h3>
        </div>
      );
    }

    if (activeCard === 'card3') {
      return (
        <div style={{ textAlign: 'center', padding: '4px 8px' }}>
          <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-22, 22px)', color: 'black', fontWeight: 'bold', lineHeight: 1.1 }}>
            {info.company_name || t("Rajdhani")}
          </h2>
          <h3 style={{ fontFamily: 'cursive', margin: '-4px 0 0 20px', fontSize: 'var(--fs-14, 14px)', color: 'black' }}>
            {t("Super Shop")}
          </h3>
        </div>
      );
    }

    // card2 (default): Company name + ShoppingCart / Address
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '4px 8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={16} color="black" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: '900', color: 'black', lineHeight: 1.1 }}>
            {info.company_name || 'রাজধানী'} <span style={{ fontWeight: 'normal' }}>সুপার শপ</span>
          </h2>
          {(info.address || info.present_address) && (
            <p style={{ margin: '2px 0 0 0', fontSize: 'var(--fs-9, 9px)', fontWeight: 'bold', color: 'black', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {info.address || info.present_address}
            </p>
          )}
        </div>
      </div>
    );
  };

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const handleMouseMove = (mouseMoveEvent) => {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`} 
      style={{ 
        overflowY: 'auto', 
        width: isCollapsed ? undefined : sidebarWidth, 
        transition: isResizing ? 'none' : undefined
      }}
    >
      {/* Resizer Handle */}
      {!isCollapsed && window.innerWidth > 1100 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '5px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: 100,
            backgroundColor: isResizing ? 'rgba(79, 70, 229, 0.5)' : 'transparent',
            transition: 'background-color 0.2s',
          }}
          onMouseDown={startResizing}
          onMouseEnter={(e) => { if (!isResizing) e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { if (!isResizing) e.target.style.backgroundColor = 'transparent'; }}
        />
      )}
      {/* Top Banner & Profile Container */}
      <div style={{
        background: 'transparent',
        padding: '16px 14px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <button 
          className="mobile-close-btn" 
          onClick={closeSidebar}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sidebar)', zIndex: 2 }}
        >
          <X size={20} />
        </button>

        {/* Active Header Banner Card (Dynamic!) */}
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: '6px',
          padding: '10px 8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          marginBottom: '16px',
          minHeight: '65px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          {renderSidebarBanner()}
        </div>

        {/* User Info */}
        <div style={{ textAlign: 'center', color: 'var(--text-sidebar)', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', letterSpacing: '-0.2px', color: 'var(--text-sidebar)' }}>
            {username}
          </h3>
          <span style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: 'var(--text-sidebar)', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {role || t("ADMIN")}
          </span>
        </div>

        {/* Quick Icon Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <button
            onClick={() => {
              if (closeSidebar) closeSidebar();
              navigate('/settings/company-information');
            }}
            title={t("Settings / Profile Header")}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--card-border)',
              color: 'var(--text-sidebar)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => {
              if (closeSidebar) closeSidebar();
              navigate('/profile');
            }}
            title={t("My Profile")}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--card-border)',
              color: 'var(--text-sidebar)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <UserCircle size={16} />
          </button>

          <button
            onClick={() => {
              if (closeSidebar) closeSidebar();
              forceLogout();
            }}
            title={t("Logout")}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--card-border)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Show Balance Button */}
        <button 
          style={{ 
            background: '#059669', 
            color: 'white', 
            border: '1px solid #34d399', 
            padding: '8px 20px', 
            borderRadius: '6px', 
            fontSize: 'var(--fs-13, 13px)', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            width: '85%'
          }}
        >
          {t('sidebar.show_balance')}
        </button>
      </div>

      <nav className="sidebar-nav" onClick={(e) => {
        if (e.target.closest('a') && closeSidebar && (window.innerWidth <= 768 || (window.innerWidth <= 1100 && window.matchMedia('(hover: none) and (pointer: coarse)').matches))) {
          closeSidebar();
        }
      }}>
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-content">
            <LayoutDashboard size={20} />
            <span>{t('menu.dashboard')}</span>
          </div>
        </NavLink>

        {/* CRM Menu Group */}
        <div>
          <div className={`nav-item ${crmOpen ? 'active' : ''}`} onClick={() => toggleMenu('crm')}>
            <div className="nav-item-content">
              <Users size={20} />
              <span>{t('menu.crm')}</span>
            </div>
            {crmOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {crmOpen && (
            <div className="submenu">
              {/* Client Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ 
                    paddingLeft: '32px', 
                    marginBottom: '4px', 
                    background: clientOpen ? '#f8fafc' : 'transparent',
                    color: clientOpen ? '#3b82f6' : 'inherit',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setClientOpen(!clientOpen);
                    if (!clientOpen) setSupplierOpen(false);
                  }}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client')}
                  </div>
                  {clientOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {clientOpen && (
                  <div style={{ paddingBottom: '8px' }}>
                    <NavLink to="/crm/client-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new_client')}
                    </NavLink>
                    <NavLink to="/crm/client-list" className="submenu-item" style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client_list')}
                    </NavLink>
                    <NavLink to="/crm/client-group" className="submenu-item" style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client_group')}
                    </NavLink>
                    <NavLink to="/crm/client-statement" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client_statement')}
                    </NavLink>
                    <NavLink to="/crm/due-collection-date" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.due_collection_date')}
                    </NavLink>
                    <NavLink to="/crm/client-cheque-schedule" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t("Client Cheque Schedule")}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Supplier Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSupplierOpen(!supplierOpen);
                    if (!supplierOpen) setClientOpen(false);
                  }} 
                  style={{ 
                    paddingLeft: '32px', 
                    marginBottom: '4px', 
                    background: supplierOpen ? '#f8fafc' : 'transparent',
                    color: supplierOpen ? '#3b82f6' : 'inherit',
                    borderRadius: '8px',
                    cursor: 'pointer' 
                  }}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier')}
                  </div>
                  {supplierOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {supplierOpen && (
                  <div className="submenu" style={{ marginLeft: '16px', background: 'transparent' }}>
                    <NavLink to="/crm/supplier-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new_supplier')}
                    </NavLink>
                    <NavLink to="/crm/supplier-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_list')}
                    </NavLink>
                    <NavLink to="/crm/supplier-group" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_group')}
                    </NavLink>
                    <NavLink to="/crm/supplier-statement" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_statement')}
                    </NavLink>
                    <NavLink to="/crm/supplier-cheque-schedule" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_cheque_schedule')}
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Menu Group */}
        <div>
          <div className={`nav-item ${accountOpen ? 'active' : ''}`} onClick={() => toggleMenu('account')}>
            <div className="nav-item-content">
              <CreditCard size={20} />
              <span>{t('menu.account')}</span>
            </div>
            {accountOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {accountOpen && (
            <div className="submenu">
              {/* Receive Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: receiveOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setReceiveOpen(!receiveOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.receive')}
                  </div>
                  {receiveOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {receiveOpen && (
                  <div>
                    <NavLink to="/account/receive-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new')}
                    </NavLink>
                    <NavLink to="/account/receive-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.receive_list')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Expense Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: expenseOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setExpenseOpen(!expenseOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.expense')}
                  </div>
                  {expenseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {expenseOpen && (
                  <div>
                    <NavLink to="/account/expense-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new')}
                    </NavLink>
                    <NavLink to="/account/expense-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.expense')}
                    </NavLink>
                    <NavLink to="/account/supplier-payment" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_payment')}
                    </NavLink>
                    <NavLink to="/account/money-return" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.money_return')}
                    </NavLink>
                    <NavLink to="/account/money-return-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.money_return_list') || 'মানি রিটার্ন লিস্ট'}
                    </NavLink>
                  </div>
                )}
              </div>
              {/* Sub-Account Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: subAccountOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setSubAccountOpen(!subAccountOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.account')}
                  </div>
                  {subAccountOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {subAccountOpen && (
                  <div>
                    <NavLink to="/account/account-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.account_create')}
                    </NavLink>
                    <NavLink to="/account/account-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.account_list')}
                    </NavLink>
                    <NavLink to="/account/account-balance" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.account_balance')}
                    </NavLink>
                    <NavLink to="/account/statement" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.statement')}
                    </NavLink>
                  </div>
                )}
              </div>
              {/* Transfer Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: transferOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setTransferOpen(!transferOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.transfer')}
                  </div>
                  {transferOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {transferOpen && (
                  <div>
                    <NavLink to="/account/transfer-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.transfer_create')}
                    </NavLink>
                    <NavLink to="/account/transfer-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.transfer_list')}
                    </NavLink>
                  </div>
                )}
              </div>
              <NavLink to="/account/profit" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '32px' }}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.profit')}
              </NavLink>
            </div>
          )}
        </div>

        {/* Loan Menu Group */}
        <div>
          <div className={`nav-item ${loanOpen ? 'active' : ''}`} onClick={() => toggleMenu('loan')}>
            <div className="nav-item-content">
              <Banknote size={20} />
              <span>{t('menu.loan')}</span>
            </div>
            {loanOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {loanOpen && (
            <div className="submenu">
              <NavLink to="/loan/client-create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)' }}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new_client')}
              </NavLink>
              <NavLink to="/loan/client-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client_list')}
              </NavLink>
              <NavLink to="/loan/receive" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.loan_receive')}
              </NavLink>
              <NavLink to="/loan/payment" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.loan_payment')}
              </NavLink>
              <NavLink to="/loan/statement" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.loan_statement')}
              </NavLink>
            </div>
          )}
        </div>
        {/* Bill Invoice Menu Group */}
        <div>
          <div className={`nav-item ${invoiceOpen ? 'active' : ''}`} onClick={() => toggleMenu('invoice')}>
            <div className="nav-item-content">
              <FileText size={20} />
              <span>{t('menu.bill_invoice')}</span>
            </div>
            {invoiceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {invoiceOpen && (
            <div className="submenu">
              <NavLink to="/invoice/add-new" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)' }}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new')}
              </NavLink>
              <NavLink to="/invoice/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.invoice_list')}
              </NavLink>
              <NavLink to="/invoice/draft" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.draft_invoice')}
              </NavLink>
              
              {/* Sales Return Submenu Group */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: salesReturnOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setSalesReturnOpen(!salesReturnOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.sales_return')}
                  </div>
                  {salesReturnOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {salesReturnOpen && (
                  <div>
                    <NavLink to="/invoice/sales-return/add-new" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_return')}
                    </NavLink>
                    <NavLink to="/invoice/sales-return/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.return_list')}
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Product Menu Group */}
        <div>
          <div className={`nav-item ${productOpen ? 'active' : ''}`} onClick={() => toggleMenu('product')}>
            <div className="nav-item-content">
              <Package size={20} />
              <span>{t('menu.product')}</span>
            </div>
            {productOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {productOpen && (
            <div className="submenu">
              {/* Nested Product Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: subProductOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setSubProductOpen(!subProductOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product')}
                  </div>
                  {subProductOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {subProductOpen && (
                  <div>
                    <NavLink to="/product/create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_create')}
                    </NavLink>
                    <NavLink to="/product/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_list')}
                    </NavLink>
                    <NavLink to="/product/group" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_group')}
                    </NavLink>
                    
                    {/* Nested Product Asset Submenu */}
                    <div>
                      <div 
                        className="nav-item" 
                        style={{ paddingLeft: '48px', marginBottom: '0', background: productAssetOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setProductAssetOpen(!productAssetOpen)}
                      >
                        <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                          <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_asset')}
                        </div>
                        {productAssetOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      
                      {productAssetOpen && (
                        <div>
                          <NavLink to="/product/unit" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '64px' }}>
                            <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_unit')}
                          </NavLink>
                          <NavLink to="/product/barcode" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '64px' }}>
                            <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_barcode')}
                          </NavLink>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Nested Purchase Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: purchaseOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setPurchaseOpen(!purchaseOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase')}
                  </div>
                  {purchaseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {purchaseOpen && (
                  <div>
                    <NavLink to="/product/purchase/add-new" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new')}
                    </NavLink>
                    <NavLink to="/product/purchase/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_list')}
                    </NavLink>
                    <NavLink to="/product/purchase/invoice-list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_invoice_list')}
                    </NavLink>
                    <NavLink to="/product/purchase/report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_report')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Nested Purchase Return Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: purchaseReturnOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setPurchaseReturnOpen(!purchaseReturnOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_return')}
                  </div>
                  {purchaseReturnOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {purchaseReturnOpen && (
                  <div>
                    <NavLink to="/product/purchase-return/add-new" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ color: 'var(--primary)', paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_new')}
                    </NavLink>
                    <NavLink to="/product/purchase-return/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_return_list')}
                    </NavLink>
                    <NavLink to="/product/purchase-return/report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_return_report')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Other standalone submenu items */}
              <NavLink to="/product/stock" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_stock')}
              </NavLink>
            </div>
          )}
        </div>
        {/* SMS Menu Group */}
        <div>
          <div className={`nav-item ${smsOpen ? 'active' : ''}`} onClick={() => toggleMenu('sms')}>
            <div className="nav-item-content">
              <MessageSquare size={20} />
              <span>{t('menu.sms')}</span>
            </div>
            {smsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {smsOpen && (
            <div className="submenu">
              <NavLink to="/sms/customer" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.customer')}
              </NavLink>
              <NavLink to="/sms/customer-group" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.customer_group')}
              </NavLink>
              <NavLink to="/sms/supplier" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier')}
              </NavLink>
              <NavLink to="/sms/supplier-group" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_group')}
              </NavLink>
              <NavLink to="/sms/schedule" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.sms_schedule')}
              </NavLink>
              <NavLink to="/sms/schedule-report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.schedule_report')}
              </NavLink>
            </div>
          )}
        </div>
        {/* Staff Menu Group */}
        <div>
          <div className={`nav-item ${staffOpen ? 'active' : ''}`} onClick={() => toggleMenu('staff')}>
            <div className="nav-item-content">
              <UserCircle size={20} />
              <span>{t('menu.staff')}</span>
            </div>
            {staffOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {staffOpen && (
            <div className="submenu">
              <NavLink to="/staff/create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_create')}
              </NavLink>
              <NavLink to="/staff/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_list')}
              </NavLink>
              
              {/* Nested Staff Payment Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: staffPaymentOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setStaffPaymentOpen(!staffPaymentOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_payment')}
                  </div>
                  {staffPaymentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {staffPaymentOpen && (
                  <div>
                    <NavLink to="/staff/payment/create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px', color: 'var(--primary)' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.payment_create')}
                    </NavLink>
                    <NavLink to="/staff/payment/report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_payment_report')}
                    </NavLink>
                  </div>
                )}
              </div>
              
              {/* Nested Staff Salary Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: staffSalaryOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setStaffSalaryOpen(!staffSalaryOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_salary')}
                  </div>
                  {staffSalaryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {staffSalaryOpen && (
                  <div>
                    <NavLink to="/staff/salary/create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.add_salary')}
                    </NavLink>
                    <NavLink to="/staff/salary/report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.salary_report')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Nested Staff Attendance Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: staffAttendanceOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setStaffAttendanceOpen(!staffAttendanceOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_attendance')}
                  </div>
                  {staffAttendanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {staffAttendanceOpen && (
                  <div>
                    <NavLink to="/staff/attendance/create" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.attendance_create')}
                    </NavLink>
                    <NavLink to="/staff/attendance/report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.attendance_report')}
                    </NavLink>
                    <NavLink to="/staff/attendance/monthly-report" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.monthly_attendance_report')}
                    </NavLink>
                  </div>
                )}
              </div>
              <NavLink to="/staff/department" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_department')}
              </NavLink>
              <NavLink to="/staff/designation" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.staff_designation')}
              </NavLink>
            </div>
          )}
        </div>
        
        {/* Due Report Menu Group */}
        <div>
          <div className={`nav-item ${dueReportOpen ? 'active' : ''}`} onClick={() => toggleMenu('dueReport')}>
            <div className="nav-item-content">
              <FileText size={20} />
              <span>{t('menu.due_report')}</span>
            </div>
            {dueReportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {dueReportOpen && (
            <div className="submenu">
              <NavLink to="/due-report/list" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.due_list')}
              </NavLink>
              <NavLink to="/due-report/client-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.client_wise')}
              </NavLink>
              <NavLink to="/due-report/group-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.group_wise')}
              </NavLink>
              <NavLink to="/due-report/supplier-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t("Supplier Due")}
              </NavLink>
            </div>
          )}
        </div>

        {/* Sales Report Menu Group */}
        <div>
          <div className={`nav-item ${salesReportOpen ? 'active' : ''}`} onClick={() => toggleMenu('salesReport')}>
            <div className="nav-item-content">
              <FileText size={20} />
              <span>{t('menu.sales_report')}</span>
            </div>
            {salesReportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {salesReportOpen && (
            <div className="submenu">
              <NavLink to="/sales-report/all" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.all')}
              </NavLink>
              <NavLink to="/sales-report/barcode-search" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.barcode_search')}
              </NavLink>
              <NavLink to="/sales-report/daily" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.daily')}
              </NavLink>
              <NavLink to="/sales-report/customer-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.customer_wise')}
              </NavLink>
              <NavLink to="/sales-report/group-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.group_wise')}
              </NavLink>
              <NavLink to="/sales-report/product-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_wise')}
              </NavLink>
              <NavLink to="/sales-report/product-group-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.product_group_wise')}
              </NavLink>
            </div>
          )}
        </div>

        {/* Deposit Report Menu Group */}
        <div>
          <div className={`nav-item ${depositReportOpen ? 'active' : ''}`} onClick={() => toggleMenu('depositReport')}>
            <div className="nav-item-content">
              <FileText size={20} />
              <span>{t('menu.deposit_report')}</span>
            </div>
            {depositReportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {depositReportOpen && (
            <div className="submenu">
              <NavLink to="/deposit-report/all" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.all_deposit')}
              </NavLink>
              <NavLink to="/deposit-report/category-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.category_wise')}
              </NavLink>
              <NavLink to="/deposit-report/customer-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.customer_wise')}
              </NavLink>
            </div>
          )}
        </div>

        {/* Expense Report Menu Group */}
        <div>
          <div className={`nav-item ${expenseReportOpen ? 'active' : ''}`} onClick={() => toggleMenu('expenseReport')}>
            <div className="nav-item-content">
              <FileText size={20} />
              <span>{t('menu.expense_report')}</span>
            </div>
            {expenseReportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {expenseReportOpen && (
            <div className="submenu">
              <NavLink to="/expense-report/all" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.all_expense')}
              </NavLink>
              <NavLink to="/expense-report/category-wise" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.category_wise')}
              </NavLink>
              <NavLink to="/expense-report/supplier-purchase" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.supplier_purchase_payment')}
              </NavLink>
            </div>
          )}
        </div>

        {/* Settings Menu Group */}
        <div>
          <div className={`nav-item ${settingsOpen ? 'active' : ''}`} onClick={() => toggleMenu('settings')}>
            <div className="nav-item-content">
              <Settings size={20} />
              <span>{t('menu.settings')}</span>
            </div>
            {settingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {settingsOpen && (
            <div className="submenu">
              
              {/* Nested Income Category Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: incomeCategoryOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setIncomeCategoryOpen(!incomeCategoryOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.income_category')}
                  </div>
                  {incomeCategoryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {incomeCategoryOpen && (
                  <div>
                    <NavLink to="/settings/income-category" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.category')}
                    </NavLink>
                    <NavLink to="/settings/income-subcategory" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.subcategory')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Nested Expense Category Submenu */}
              <div>
                <div 
                  className="nav-item" 
                  style={{ paddingLeft: '32px', marginBottom: '0', background: expenseCategorySettingOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setExpenseCategorySettingOpen(!expenseCategorySettingOpen)}
                >
                  <div className="nav-item-content" style={{ fontSize: 'var(--sidebar-font-size, var(--fs-14, 14px))' }}>
                    <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.expense_category')}
                  </div>
                  {expenseCategorySettingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                
                {expenseCategorySettingOpen && (
                  <div>
                    <NavLink to="/settings/expense-category" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.category')}
                    </NavLink>
                    <NavLink to="/settings/expense-subcategory" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.subcategory')}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Other standalone submenu items */}
              <NavLink to="/settings/shortcut-menu" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.shortcut_menu')}
              </NavLink>
              <NavLink to="/settings/payment-method" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.payment_method')}
              </NavLink>
              <NavLink to="/settings/company-information" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.company_information')}
              </NavLink>
              <NavLink to="/settings/bank" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.bank_list')}
              </NavLink>
              <NavLink to="/settings/settings" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t('menu.settings')}
              </NavLink>
              <NavLink to="/settings/users" className={({isActive}) => `submenu-item ${isActive ? 'active' : ''}`}>
                <span style={{ marginRight: '8px' }}>»</span> {t("Users & Permissions")}
              </NavLink>

            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="nav-item" style={{ cursor: 'pointer' }} onClick={() => forceLogout()}>
          <div className="nav-item-content">
            <LogOut size={20} />
            <span>{t('menu.sign_out')}</span>
          </div>
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;
