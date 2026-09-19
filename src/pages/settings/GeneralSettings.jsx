import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import { settingService } from '../../services/settingService';
import PrintHeader from '../../components/PrintHeader';

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');

// Toggle persisted on the server (general-settings API) under settings[slug(label)]
const ToggleItem = ({ label, defaultChecked = false, hasInput = false, inputValue = "" }) => {
  const { settings, setSetting } = useAppSettings();
  const key = slug(label);
  const checked = settings[key] === undefined ? defaultChecked : !!settings[key];
  const value = settings[key] === undefined ? inputValue : settings[key];
  const setChecked = (v) => setSetting(key, v);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '8px', background: 'white' }}>
      {hasInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          <label style={{ fontSize: 'var(--fs-11, 11px)', color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
            {label}
          </label>
          <input type="text" value={value} onChange={(e) => setSetting(key, e.target.value)} style={{ border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '4px 0', fontSize: 'var(--fs-14, 14px)' }} />
        </div>
      ) : (
        <>
          <label style={{ fontSize: 'var(--fs-14, 14px)', color: '#1f2937', cursor: 'pointer', flex: 1 }} onClick={() => setChecked(!checked)}>
            {label}
          </label>
          <div 
            onClick={() => setChecked(!checked)}
            style={{
              width: '44px',
              height: '24px',
              background: checked ? 'var(--primary)' : '#f1f5f9',
              border: checked ? 'none' : '1px solid #cbd5e1',
              borderRadius: '12px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: checked ? '2px' : '1px',
              left: checked ? '22px' : '2px',
              transition: 'left 0.3s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }} />
          </div>
        </>
      )}
    </div>
  );
};

const DEFAULT_RECEIVE_SMS = `Dear {client_name},\nThank you for the payment of {receive_amount} TK\nDue : {due_amount} for {description}.\nRAJDHANI FABRICS & GARMENTS\nHELPLINE: {company_mobile}`;
const DEFAULT_INVOICE_SMS = `Dear {client_name},\nThank you for purchasing our products.\nTotal bill: {total_bill} TK\nPayment: {total_payment}\nDue : {invoice_due}\nTotal Due: {client_total_due}.\nRAJDHANI FABRICS & GARMENTS\nHELPLINE: {company_mobile}`;

const GeneralSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, updateTheme, resetTheme } = useAppContext();
  const { settings, setSetting } = useAppSettings();
  const theme = state?.theme || {};
  const [activeTab, setActiveTab] = useState('General');
  const [localTheme, setLocalTheme] = useState(theme);

  // SMS template settings (backend: GET/PUT /api/erpsetting/sms-settings/)
  // fields: receive_sms_status, receive_sms_body, invoice_sms_status, invoice_sms_body
  const [smsSettings, setSmsSettings] = useState({
    receive_sms_status: false,
    receive_sms_body: DEFAULT_RECEIVE_SMS,
    invoice_sms_status: false,
    invoice_sms_body: DEFAULT_INVOICE_SMS,
  });
  const [smsSaving, setSmsSaving] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    settingService.getSmsSettings().then((res) => {
      const data = res?.data && typeof res.data === 'object' ? res.data : res;
      if (data && typeof data === 'object') {
        setSmsSettings((prev) => ({
          receive_sms_status: !!data.receive_sms_status,
          receive_sms_body: data.receive_sms_body ?? prev.receive_sms_body,
          invoice_sms_status: !!data.invoice_sms_status,
          invoice_sms_body: data.invoice_sms_body ?? prev.invoice_sms_body,
        }));
      }
    }).catch((e) => toast.error(e?.message || t("Failed to load SMS settings")));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSms = async () => {
    try {
      setSmsSaving(true);
      await settingService.updateSmsSettings({
        receive_sms_status: !!smsSettings.receive_sms_status,
        receive_sms_body: smsSettings.receive_sms_body,
        invoice_sms_status: !!smsSettings.invoice_sms_status,
        invoice_sms_body: smsSettings.invoice_sms_body,
      });
      toast.success(t("SMS settings saved"));
    } catch (e) {
      toast.error(e.message || t("Failed to save SMS settings"));
    } finally {
      setSmsSaving(false);
    }
  };

  const handleColorChange = (key, value) => {
    setLocalTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    try {
      await updateTheme(localTheme);
      toast.success(t("Theme updated"));
    } catch (e) {
      toast.error(e?.message || t("Failed to save theme"));
    }
  };

  const tabs = [
    'General', 'Invoice', 'Receive', 'Product', 'Purchase', 
    'Client', 'Supplier', 'SMS', 'E-mail', 'Color'
  ];

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
        <PrintHeader />
      
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)', textTransform: 'uppercase' }}>{t('settings_tabs.title')}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: activeTab === tab ? 'var(--primary)' : 'var(--card-border)',
                    background: activeTab === tab ? 'var(--primary)' : 'white',
                    color: activeTab === tab ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--fs-14, 14px)',
                    fontWeight: activeTab === tab ? 'bold' : 'normal'
                  }}
                >
                  {t(`settings_tabs.${tab}`)}
                </button>
              ))}
            </div>
            
            <button style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
              {t('settings_tabs.user_permissions')}
            </button>
          </div>

          <div style={{ border: '1px solid #7dd3fc', borderRadius: '8px', padding: '32px', background: 'white' }}>
            
            {activeTab === 'General' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px' }}>{t("Language")}</label>
                  <select value={i18n.language === 'bn' ? 'bn' : 'en'} onChange={(e) => i18n.changeLanguage(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none' }}>
                    <option value="en">{t("English")}</option>
                    <option value="bn">{t("Bengali")}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', marginBottom: '8px' }}>{t("Menu Size")}</label>
                  <select value={settings.menu_size || 'Medium'} onChange={(e) => setSetting('menu_size', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none' }}>
                    <option>{t("Large")}</option>
                    <option>{t("Medium")}</option>
                    <option>{t("Small")}</option>
                  </select>
                </div>

                <ToggleItem label={t("Invoice Header (Custom)")} defaultChecked={true} />
              </div>
            )}

            {activeTab === 'Invoice' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Over Stock Selling")} defaultChecked={true} />
                  <ToggleItem label={t("Discount")} defaultChecked={false} />
                  <ToggleItem label={t("Transport Fare")} defaultChecked={false} />
                  <ToggleItem label={t("Receive Amount")} defaultChecked={true} />
                  <ToggleItem label={t("Highest Due")} defaultChecked={false} />
                  <ToggleItem label={t("Vat Type Flat")} defaultChecked={false} />
                  <ToggleItem label={t("E-mail")} defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Invoice Seperate Item")} defaultChecked={false} />
                  <ToggleItem label={t("Discount Type Flat")} defaultChecked={false} />
                  <ToggleItem label={t("Labour Cost")} defaultChecked={false} />
                  <ToggleItem label={t("Due Amount")} defaultChecked={false} />
                  <ToggleItem label={t("Vat")} defaultChecked={false} />
                  <ToggleItem label={t("SMS")} defaultChecked={false} />
                  <ToggleItem label={t("Description")} defaultChecked={false} />
                </div>
              </div>
            )}

            {activeTab === 'Receive' && (
              <div style={{ maxWidth: '600px' }}>
                <ToggleItem label={t("Invoice payment from receive")} defaultChecked={false} />
              </div>
            )}

            {activeTab === 'Product' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Opening Stock")} defaultChecked={true} />
                  <ToggleItem label={t("Multi Pricing")} defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <ToggleItem label={t("View Stock Warning")} defaultChecked={false} />
                    <ToggleItem label={t("Manual Barcode")} defaultChecked={false} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <ToggleItem label={t("New Price Sale Only")} defaultChecked={true} />
                    <ToggleItem label={t("Sale Price Percentage")} hasInput={true} inputValue="35.00" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Purchase' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Purchase Seperate Item")} defaultChecked={true} />
                  <ToggleItem label={t("Warehouse")} defaultChecked={false} />
                  <ToggleItem label={t("Transport Fare")} defaultChecked={false} />
                  <ToggleItem label={t("Receive Amount")} defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Issued Date")} defaultChecked={true} />
                  <ToggleItem label={t("Discount")} defaultChecked={false} />
                  <ToggleItem label={t("Vat")} defaultChecked={false} />
                </div>
              </div>
            )}

            {activeTab === 'Client' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("ID No")} defaultChecked={false} />
                  <ToggleItem label={t("Company Name")} defaultChecked={false} />
                  <ToggleItem label={t("Phone Number")} defaultChecked={true} />
                  <ToggleItem label={t("Previous Due")} defaultChecked={true} />
                  <ToggleItem label={t("E-mail")} defaultChecked={false} />
                  <ToggleItem label={t("Upzilla")} defaultChecked={false} />
                  <ToggleItem label={t("Client Group")} defaultChecked={true} />
                  <ToggleItem label={t("Status")} defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Client Name")} defaultChecked={true} />
                  <ToggleItem label={t("Address")} defaultChecked={true} />
                  <ToggleItem label={t("Phone Number 2")} defaultChecked={true} />
                  <ToggleItem label={t("Max Due Limit")} defaultChecked={false} />
                  <ToggleItem label={t("Date Of Birth")} defaultChecked={false} />
                  <ToggleItem label={t("Zip Code")} defaultChecked={false} />
                  <ToggleItem label={t("Image")} defaultChecked={false} />
                </div>
              </div>
            )}
            
            {activeTab === 'Supplier' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Company Name")} defaultChecked={false} />
                  <ToggleItem label={t("E-mail")} defaultChecked={false} />
                  <ToggleItem label={t("Present Address")} defaultChecked={true} />
                  <ToggleItem label={t("Zip Code")} defaultChecked={false} />
                  <ToggleItem label={t("Domain")} defaultChecked={false} />
                  <ToggleItem label={t("Image")} defaultChecked={false} />
                  <ToggleItem label={t("Status")} defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label={t("Phone Number (Optional)")} defaultChecked={false} />
                  <ToggleItem label={t("Previous Due")} defaultChecked={true} />
                  <ToggleItem label={t("City")} defaultChecked={false} />
                  <ToggleItem label={t("Country Name")} defaultChecked={false} />
                  <ToggleItem label={t("Bank Account")} defaultChecked={true} />
                  <ToggleItem label={t("Supplier Group")} defaultChecked={true} />
                </div>
              </div>
            )}
            
            {activeTab === 'SMS' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', fontWeight: '500' }}>{t("Receive SMS")}</label>
                      <label style={{ fontSize: 'var(--fs-12, 12px)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!smsSettings.receive_sms_status} onChange={(e) => setSmsSettings((p) => ({ ...p, receive_sms_status: e.target.checked }))} />
                        {t("Send automatically")}
                      </label>
                    </div>
                    <textarea
                      style={{ width: '100%', height: '200px', padding: '16px', border: '1px solid #10b981', borderRadius: '4px', outline: 'none', resize: 'none', fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}
                      value={smsSettings.receive_sms_body} onChange={(e) => setSmsSettings((p) => ({ ...p, receive_sms_body: e.target.value }))}
                    />
                    <small style={{ color: '#64748b' }}>{t("Variables:")} {'{client_name} {receive_amount} {due_amount} {description} {company_mobile}'}</small>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--label-color)', fontWeight: '500' }}>{t("Invoice SMS")}</label>
                      <label style={{ fontSize: 'var(--fs-12, 12px)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!smsSettings.invoice_sms_status} onChange={(e) => setSmsSettings((p) => ({ ...p, invoice_sms_status: e.target.checked }))} />
                        {t("Send automatically")}
                      </label>
                    </div>
                    <textarea
                      style={{ width: '100%', height: '200px', padding: '16px', border: '1px solid #10b981', borderRadius: '4px', outline: 'none', resize: 'none', fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}
                      value={smsSettings.invoice_sms_body} onChange={(e) => setSmsSettings((p) => ({ ...p, invoice_sms_body: e.target.value }))}
                    />
                    <small style={{ color: '#64748b' }}>{t("Variables:")} {'{client_name} {total_bill} {total_payment} {invoice_due} {client_total_due} {company_mobile}'}</small>
                  </div>
                </div>
                <button onClick={saveSms} disabled={smsSaving} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
                  {smsSaving ? t("Saving...") : t("Save")}
                </button>
              </div>
            )}

            {activeTab === 'E-mail' && (
              <div style={{ padding: '24px', border: '1px solid #93c5fd', borderRadius: '8px', background: 'white' }}>
                <span style={{ fontSize: 'var(--fs-14, 14px)', color: '#1f2937' }}>{t("E-mail")}</span>
              </div>
            )}

            {activeTab === 'Color' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Color Block Helper */}
                {(() => {
                  const ColorInput = ({ label, themeKey }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ minHeight: '32px', display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-color)', textTransform: 'uppercase', lineHeight: '1.25' }}>{label}</label>
                      </div>
                      <div style={{ display: 'flex', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                        <input type="color" value={localTheme[themeKey] || '#ffffff'} onChange={(e) => handleColorChange(themeKey, e.target.value)} style={{ width: '40px', height: '100%', padding: '0', border: 'none', cursor: 'pointer' }} />
                        <input type="text" value={localTheme[themeKey] || ''} onChange={(e) => handleColorChange(themeKey, e.target.value)} style={{ flex: 1, border: 'none', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>
                  );

                  return (
                    <>
                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("TYPOGRAPHY")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', maxWidth: '850px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'flex-end' }}>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-color)', textTransform: 'uppercase', lineHeight: '1.25' }}>{t("Global Font Family")}</label>
                            </div>
                            <select value={localTheme['--main-font'] || "'Inter', sans-serif"} onChange={(e) => handleColorChange('--main-font', e.target.value)} style={{ height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}>
                              <option value="'Inter', sans-serif">Inter</option>
                              <option value="'Roboto', sans-serif">Roboto</option>
                              <option value="'Poppins', sans-serif">Poppins</option>
                              <option value="'Outfit', sans-serif">Outfit</option>
                              <option value="'Open Sans', sans-serif">Open Sans</option>
                              <option value="'Hind Siliguri', sans-serif">Hind Siliguri</option>
                            </select>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'flex-end' }}>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-color)', textTransform: 'uppercase', lineHeight: '1.25' }}>{t("Global Font Size")}</label>
                            </div>
                            <select value={localTheme['--main-font-size'] || "13px"} onChange={(e) => handleColorChange('--main-font-size', e.target.value)} style={{ height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}>
                              <option value="11px">11px</option>
                              <option value="12px">12px</option>
                              <option value="13px">13px (Default)</option>
                              <option value="14px">14px</option>
                              <option value="15px">15px</option>
                              <option value="16px">16px</option>
                              <option value="18px">18px</option>
                              <option value="20px">20px</option>
                              <option value="22px">22px</option>
                              <option value="24px">24px</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'flex-end' }}>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-color)', textTransform: 'uppercase', lineHeight: '1.25' }}>{t("Sidebar Menu Font Size")}</label>
                            </div>
                            <select value={localTheme['--sidebar-font-size'] || "14px"} onChange={(e) => handleColorChange('--sidebar-font-size', e.target.value)} style={{ height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}>
                              <option value="11px">11px</option>
                              <option value="12px">12px</option>
                              <option value="13px">13px</option>
                              <option value="14px">14px (Default)</option>
                              <option value="15px">15px</option>
                              <option value="16px">16px</option>
                              <option value="18px">18px</option>
                              <option value="20px">20px</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'flex-end' }}>
                              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-color)', textTransform: 'uppercase', lineHeight: '1.25' }}>{t("Sidebar Submenu Font Size")}</label>
                            </div>
                            <select value={localTheme['--sidebar-submenu-font-size'] || "13px"} onChange={(e) => handleColorChange('--sidebar-submenu-font-size', e.target.value)} style={{ height: '38px', padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}>
                              <option value="10px">10px</option>
                              <option value="11px">11px</option>
                              <option value="12px">12px</option>
                              <option value="13px">13px (Default)</option>
                              <option value="14px">14px</option>
                              <option value="15px">15px</option>
                              <option value="16px">16px</option>
                              <option value="18px">18px</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("LAYOUT COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Layout Color")} themeKey="--bg-app" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("SIDEBAR COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Sidebar Color")} themeKey="--bg-sidebar" />
                          <ColorInput label={t("Sidebar Menu Hover Color")} themeKey="--sidebar-hover" />
                          <ColorInput label={t("Sidebar Text Color")} themeKey="--text-sidebar" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("CARD COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Card Border Color")} themeKey="--card-border" />
                          <ColorInput label={t("Card Header Color")} themeKey="--card-header-bg" />
                          <ColorInput label={t("Card Body Color")} themeKey="--bg-surface" />
                          <ColorInput label={t("Card Text Color")} themeKey="--text-main" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("INPUT COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Input Background Color")} themeKey="--input-bg" />
                          <ColorInput label={t("Label Color")} themeKey="--label-color" />
                          <ColorInput label={t("Input Color")} themeKey="--input-text" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("TABLE COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Table Header BG Color")} themeKey="--table-header-bg" />
                          <ColorInput label={t("Table Header Text Color")} themeKey="--table-header-text" />
                          <ColorInput label={t("Table Text Color")} themeKey="--table-text" />
                          <ColorInput label={t("Table Header Border Color")} themeKey="--table-border" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>{t("BUTTON COLOR")}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label={t("Success Button Color")} themeKey="--success" />
                          <ColorInput label={t("Danger Button Color")} themeKey="--danger" />
                          <ColorInput label={t("Info Button Color")} themeKey="--info" />
                          <ColorInput label={t("Warning Button Color")} themeKey="--warning" />
                          <ColorInput label={t("Primary Button Color")} themeKey="--primary" />
                          <ColorInput label={t("Secondary Button Color")} themeKey="--secondary" />
                          <ColorInput label={t("Dark Button Color")} themeKey="--dark" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <button onClick={handleUpdate} style={{ flex: 1, background: 'var(--success)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
                          {t("Update")}
                        </button>
                        <button onClick={() => resetTheme().then(() => toast.success(t("Theme reset"))).catch((e) => toast.error(e?.message || t("Failed to reset theme")))} style={{ flex: 1, background: 'var(--danger)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
                          {t("Reset Color")}
                        </button>
                      </div>
                    </>
                  );
                })()}

              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default GeneralSettings;
