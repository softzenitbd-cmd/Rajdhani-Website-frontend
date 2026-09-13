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
          <label style={{ fontSize: '11px', color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
            {label}
          </label>
          <input type="text" value={value} onChange={(e) => setSetting(key, e.target.value)} style={{ border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '4px 0', fontSize: '14px' }} />
        </div>
      ) : (
        <>
          <label style={{ fontSize: '14px', color: '#1f2937', cursor: 'pointer', flex: 1 }} onClick={() => setChecked(!checked)}>
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
    }).catch((e) => toast.error(e?.message || 'Failed to load SMS settings'));
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
      toast.success('SMS settings saved');
    } catch (e) {
      toast.error(e.message || 'Failed to save SMS settings');
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
      toast.success('Theme updated');
    } catch (e) {
      toast.error(e?.message || 'Failed to save theme');
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
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)', textTransform: 'uppercase' }}>{t('settings_tabs.title')}</h2>
          
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
                    fontSize: '14px',
                    fontWeight: activeTab === tab ? 'bold' : 'normal'
                  }}
                >
                  {t(`settings_tabs.${tab}`)}
                </button>
              ))}
            </div>
            
            <button style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              {t('settings_tabs.user_permissions')}
            </button>
          </div>

          <div style={{ border: '1px solid #7dd3fc', borderRadius: '8px', padding: '32px', background: 'white' }}>
            
            {activeTab === 'General' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px' }}>Language</label>
                  <select value={i18n.language === 'bn' ? 'bn' : 'en'} onChange={(e) => i18n.changeLanguage(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none' }}>
                    <option value="en">English</option>
                    <option value="bn">Bengali</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px' }}>Menu Size</label>
                  <select value={settings.menu_size || 'Medium'} onChange={(e) => setSetting('menu_size', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '8px', outline: 'none' }}>
                    <option>Large</option>
                    <option>Medium</option>
                    <option>Small</option>
                  </select>
                </div>

                <ToggleItem label="Invoice Header (Custom)" defaultChecked={true} />
              </div>
            )}

            {activeTab === 'Invoice' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Over Stock Selling" defaultChecked={true} />
                  <ToggleItem label="Discount" defaultChecked={false} />
                  <ToggleItem label="Transport Fare" defaultChecked={false} />
                  <ToggleItem label="Receive Amount" defaultChecked={true} />
                  <ToggleItem label="Highest Due" defaultChecked={false} />
                  <ToggleItem label="Vat Type Flat" defaultChecked={false} />
                  <ToggleItem label="E-mail" defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Invoice Seperate Item" defaultChecked={false} />
                  <ToggleItem label="Discount Type Flat" defaultChecked={false} />
                  <ToggleItem label="Labour Cost" defaultChecked={false} />
                  <ToggleItem label="Due Amount" defaultChecked={false} />
                  <ToggleItem label="Vat" defaultChecked={false} />
                  <ToggleItem label="SMS" defaultChecked={false} />
                  <ToggleItem label="Description" defaultChecked={false} />
                </div>
              </div>
            )}

            {activeTab === 'Receive' && (
              <div style={{ maxWidth: '600px' }}>
                <ToggleItem label="Invoice payment from receive" defaultChecked={false} />
              </div>
            )}

            {activeTab === 'Product' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Opening Stock" defaultChecked={true} />
                  <ToggleItem label="Multi Pricing" defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <ToggleItem label="View Stock Warning" defaultChecked={false} />
                    <ToggleItem label="Manual Barcode" defaultChecked={false} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <ToggleItem label="New Price Sale Only" defaultChecked={true} />
                    <ToggleItem label="Sale Price Percentage" hasInput={true} inputValue="35.00" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Purchase' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Purchase Seperate Item" defaultChecked={true} />
                  <ToggleItem label="Warehouse" defaultChecked={false} />
                  <ToggleItem label="Transport Fare" defaultChecked={false} />
                  <ToggleItem label="Receive Amount" defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Issued Date" defaultChecked={true} />
                  <ToggleItem label="Discount" defaultChecked={false} />
                  <ToggleItem label="Vat" defaultChecked={false} />
                </div>
              </div>
            )}

            {activeTab === 'Client' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="ID No" defaultChecked={false} />
                  <ToggleItem label="Company Name" defaultChecked={false} />
                  <ToggleItem label="Phone Number" defaultChecked={true} />
                  <ToggleItem label="Previous Due" defaultChecked={true} />
                  <ToggleItem label="E-mail" defaultChecked={false} />
                  <ToggleItem label="Upzilla" defaultChecked={false} />
                  <ToggleItem label="Client Group" defaultChecked={true} />
                  <ToggleItem label="Status" defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Client Name" defaultChecked={true} />
                  <ToggleItem label="Address" defaultChecked={true} />
                  <ToggleItem label="Phone Number 2" defaultChecked={true} />
                  <ToggleItem label="Max Due Limit" defaultChecked={false} />
                  <ToggleItem label="Date Of Birth" defaultChecked={false} />
                  <ToggleItem label="Zip Code" defaultChecked={false} />
                  <ToggleItem label="Image" defaultChecked={false} />
                </div>
              </div>
            )}
            
            {activeTab === 'Supplier' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Company Name" defaultChecked={false} />
                  <ToggleItem label="E-mail" defaultChecked={false} />
                  <ToggleItem label="Present Address" defaultChecked={true} />
                  <ToggleItem label="Zip Code" defaultChecked={false} />
                  <ToggleItem label="Domain" defaultChecked={false} />
                  <ToggleItem label="Image" defaultChecked={false} />
                  <ToggleItem label="Status" defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleItem label="Phone Number (Optional)" defaultChecked={false} />
                  <ToggleItem label="Previous Due" defaultChecked={true} />
                  <ToggleItem label="City" defaultChecked={false} />
                  <ToggleItem label="Country Name" defaultChecked={false} />
                  <ToggleItem label="Bank Account" defaultChecked={true} />
                  <ToggleItem label="Supplier Group" defaultChecked={true} />
                </div>
              </div>
            )}
            
            {activeTab === 'SMS' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--label-color)', fontWeight: '500' }}>Receive SMS</label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!smsSettings.receive_sms_status} onChange={(e) => setSmsSettings((p) => ({ ...p, receive_sms_status: e.target.checked }))} />
                        Send automatically
                      </label>
                    </div>
                    <textarea
                      style={{ width: '100%', height: '200px', padding: '16px', border: '1px solid #10b981', borderRadius: '4px', outline: 'none', resize: 'none', fontSize: '14px', color: 'var(--text-main)' }}
                      value={smsSettings.receive_sms_body} onChange={(e) => setSmsSettings((p) => ({ ...p, receive_sms_body: e.target.value }))}
                    />
                    <small style={{ color: '#64748b' }}>Variables: {'{client_name} {receive_amount} {due_amount} {description} {company_mobile}'}</small>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--label-color)', fontWeight: '500' }}>Invoice SMS</label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!smsSettings.invoice_sms_status} onChange={(e) => setSmsSettings((p) => ({ ...p, invoice_sms_status: e.target.checked }))} />
                        Send automatically
                      </label>
                    </div>
                    <textarea
                      style={{ width: '100%', height: '200px', padding: '16px', border: '1px solid #10b981', borderRadius: '4px', outline: 'none', resize: 'none', fontSize: '14px', color: 'var(--text-main)' }}
                      value={smsSettings.invoice_sms_body} onChange={(e) => setSmsSettings((p) => ({ ...p, invoice_sms_body: e.target.value }))}
                    />
                    <small style={{ color: '#64748b' }}>Variables: {'{client_name} {total_bill} {total_payment} {invoice_due} {client_total_due} {company_mobile}'}</small>
                  </div>
                </div>
                <button onClick={saveSms} disabled={smsSaving} style={{ width: '100%', background: 'var(--success)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  {smsSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}

            {activeTab === 'E-mail' && (
              <div style={{ padding: '24px', border: '1px solid #93c5fd', borderRadius: '8px', background: 'white' }}>
                <span style={{ fontSize: '14px', color: '#1f2937' }}>E-mail</span>
              </div>
            )}

            {activeTab === 'Color' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Color Block Helper */}
                {(() => {
                  const ColorInput = ({ label, themeKey }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--label-color)', textTransform: 'uppercase' }}>{label}</label>
                      <div style={{ display: 'flex', height: '36px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                        <input type="color" value={localTheme[themeKey] || '#ffffff'} onChange={(e) => handleColorChange(themeKey, e.target.value)} style={{ width: '40px', height: '100%', padding: '0', border: 'none', cursor: 'pointer' }} />
                        <input type="text" value={localTheme[themeKey] || ''} onChange={(e) => handleColorChange(themeKey, e.target.value)} style={{ flex: 1, border: 'none', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>
                  );

                  return (
                    <>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>LAYOUT COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Layout Color" themeKey="--bg-app" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>SIDEBAR COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Sidebar Color" themeKey="--bg-sidebar" />
                          <ColorInput label="Sidebar Menu Hover Color" themeKey="--sidebar-hover" />
                          <ColorInput label="Sidebar Text Color" themeKey="--text-sidebar" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>CARD COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Card Border Color" themeKey="--card-border" />
                          <ColorInput label="Card Header Color" themeKey="--card-header-bg" />
                          <ColorInput label="Card Body Color" themeKey="--bg-surface" />
                          <ColorInput label="Card Text Color" themeKey="--text-main" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>INPUT COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Input Background Color" themeKey="--input-bg" />
                          <ColorInput label="Label Color" themeKey="--label-color" />
                          <ColorInput label="Input Color" themeKey="--input-text" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>TABLE COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Table Header BG Color" themeKey="--table-header-bg" />
                          <ColorInput label="Table Header Text Color" themeKey="--table-header-text" />
                          <ColorInput label="Table Text Color" themeKey="--table-text" />
                          <ColorInput label="Table Header Border Color" themeKey="--table-border" />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase' }}>BUTTON COLOR</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                          <ColorInput label="Success Button Color" themeKey="--success" />
                          <ColorInput label="Danger Button Color" themeKey="--danger" />
                          <ColorInput label="Info Button Color" themeKey="--info" />
                          <ColorInput label="Warning Button Color" themeKey="--warning" />
                          <ColorInput label="Primary Button Color" themeKey="--primary" />
                          <ColorInput label="Secondary Button Color" themeKey="--secondary" />
                          <ColorInput label="Dark Button Color" themeKey="--dark" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <button onClick={handleUpdate} style={{ flex: 1, background: 'var(--success)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                          Update
                        </button>
                        <button onClick={() => resetTheme().then(() => toast.success('Theme reset')).catch((e) => toast.error(e?.message || 'Failed to reset theme'))} style={{ flex: 1, background: 'var(--danger)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                          Reset Color
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
