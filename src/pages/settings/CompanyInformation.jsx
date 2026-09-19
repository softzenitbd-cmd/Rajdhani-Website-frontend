import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building, MapPin, Mail, DollarSign, FileText, 
  MessageSquare, User, Phone, Map, ShoppingCart, Save, CheckCircle, Upload, Image as Layout, Check
} from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { companyStore, companyHeaderImage } from '../../services/companyStore';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useToast } from '../../context/ToastContext';

// Fields of GET/PUT /api/erpsetting/company-info/
const EMPTY_INFO = {
  company_name: '',
  proprietor: '',
  company_type: '',
  country: '',
  present_address: '',
  address: '',
  email: '',
  phone_number: '',
  city: '',
  state: '',
  zip_code: '',
  stock_warning: '',
  currency_symbol: '',
  invoice_greetings: '',
  invoice_footer: '',
  sms_api_key: '',
  sms_secret_key: '',
  sms_sender_id: '',
  sms_base_url: '',
  status: true,
};

/**
 * Company profile + print header selection.
 *  - fields            → PUT /api/erpsetting/company-info/
 *  - banner image      → PUT (multipart) /api/erpsetting/company-info/  field `memo_header_image`
 *  - logo              → PUT (multipart) /api/erpsetting/company-info/  field `logo`
 *  - header card/mode  → general settings keys print_header_card / print_header_mode
 */
const CompanyInformation = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { settings, updateSettings } = useAppSettings();

  const headerMode = settings.print_header_mode || 'card';
  const activeCard = settings.print_header_card || 'card2';

  const [companyInfo, setCompanyInfo] = useState(() => ({ ...EMPTY_INFO, ...companyStore.getCached() }));
  const [rightLogoPreview, setRightLogoPreview] = useState(null);
  const [logo1Preview, setLogo1Preview] = useState(null);
  const [logo2Preview, setLogo2Preview] = useState(null);
  const [logo3Preview, setLogo3Preview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const data = await companyStore.load(true);
      setCompanyInfo((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to load company information' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Persist the chosen header style on the server
  const selectCardAsHeader = async (cardKey, previewObj) => {
    try {
      await updateSettings({ print_header_card: cardKey, print_header_mode: previewObj?.url ? 'image' : 'card' });
      setMessage({ type: 'success', text: t("Header updated to {{v0}} across full project!", { v0: cardKey.toUpperCase() }) });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save header selection' });
    }
  };

  // Upload an image and make it the print header (stored on the company row)
  const uploadHeaderImage = async (file) => {
    const formData = new FormData();
    formData.append('memo_header_image', file);
    const saved = await companyStore.save(formData, true);
    if (!companyHeaderImage(saved)) {
      // backend did not echo the file url back – re-read the row
      await companyStore.load(true);
    }
    setCompanyInfo((prev) => ({ ...prev, ...companyStore.getCached() }));
    await updateSettings({ print_header_mode: 'image' });
  };

  const handleFileChange = async (e, setPreview, cardKey) => {
    const file = e.target.files[0];
    if (!file) return;
    const prevObj = { url: URL.createObjectURL(file), name: file.name };
    setPreview(prevObj);
    try {
      await uploadHeaderImage(file);
      await updateSettings({ print_header_card: cardKey });
      setMessage({ type: 'success', text: t("Header image uploaded and activated!") });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to upload header image' });
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRightLogoPreview({ url: URL.createObjectURL(file), name: file.name });
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const saved = await companyStore.save(formData, true);
      setCompanyInfo((prev) => ({ ...prev, ...saved }));
      setMessage({ type: 'success', text: t("Company logo uploaded!") });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to upload logo' });
    }
  };

  const handleCustomBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadHeaderImage(file);
      setMessage({ type: 'success', text: t("Custom header banner uploaded and activated!") });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to upload banner' });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      // never send file/url fields back as text
      const { memo_header_image, logo, id, created_at, updated_at, ...payload } = companyInfo;
      if (payload.stock_warning === '' || payload.stock_warning === null) delete payload.stock_warning;
      const saved = await companyStore.save(payload);
      setCompanyInfo((prev) => ({ ...prev, ...saved }));
      setMessage({ type: 'success', text: t("Company Information updated & synced across full project!") });
      toast.success(t("Company information saved"));
    } catch (err) {
      console.error("Error saving company info:", err);
      setMessage({ type: 'error', text: err?.message || 'Failed to save company information' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: '#f5f3ff' }}>
      
      {/* Active Header Banner Preview */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layout size={20} /> {t("Active Project Header Preview")}
            </h3>
            <span style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>{t("Click any card below to set that logo/header as the active banner for invoices & print vouchers.")}</span>
          </div>

          <label style={{ background: '#7c3aed', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> {t("Upload Custom Banner")}
            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleCustomBannerChange} />
          </label>
        </div>

        {/* Live Preview */}
        <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '8px', border: '1px dashed #c084fc' }}>
          <PrintHeader />
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: 'var(--fs-14, 14px)',
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#ef4444' : '#16a34a',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`
        }}>
          <CheckCircle size={18} />
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '2px solid #22c55e' }}>
        <div style={{ padding: '8px 24px', background: 'rgba(34, 197, 94, 0.2)', borderBottom: '1px solid #22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>{t("Company Information")}</h2>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving || loading}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Save size={14} /> {saving ? t("Saving...") : loading ? t("Loading...") : t("Update Company")}
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField icon={Building} label={t("Company Name")} name="company_name" value={companyInfo.company_name} onChange={handleInputChange} />
              <InputField icon={Building} label={t("Company Type")} name="company_type" value={companyInfo.company_type} onChange={handleInputChange} />
              <InputField icon={MapPin} label={t("Present Address")} name="present_address" value={companyInfo.present_address} onChange={handleInputChange} />
              <InputField icon={Mail} label={t("Email")} name="email" value={companyInfo.email} onChange={handleInputChange} type="email" />
              <InputField icon={Building} label={t("City")} name="city" value={companyInfo.city} onChange={handleInputChange} />
              <InputField icon={MapPin} label={t("Zip Code")} name="zip_code" value={companyInfo.zip_code} onChange={handleInputChange} />
              <InputField icon={DollarSign} label={t("Currency Symbol")} name="currency_symbol" value={companyInfo.currency_symbol} onChange={handleInputChange} />
              <InputField icon={FileText} label={t("Invoice Footer")} name="invoice_footer" value={companyInfo.invoice_footer} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label={t("SMS Sender ID")} name="sms_sender_id" value={companyInfo.sms_sender_id} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label={t("SMS Base URL")} name="sms_base_url" value={companyInfo.sms_base_url} onChange={handleInputChange} />

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Status")}</label>
                <select
                  name="status"
                  value={companyInfo.status === false || companyInfo.status === 'false' || companyInfo.status === 0 ? 'false' : 'true'}
                  onChange={(e) => setCompanyInfo((prev) => ({ ...prev, status: e.target.value === 'true' }))}
                  style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', color: 'var(--text-main)', background: 'white' }}
                >
                  <option value="true">{t("Active")}</option>
                  <option value="false">{t("Inactive")}</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField icon={User} label={t("Proprietor")} name="proprietor" value={companyInfo.proprietor} onChange={handleInputChange} />

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0284c7', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <MapPin size={10} color="white" /> {t("Country")}
                </label>
                <input type="text" name="country" value={companyInfo.country || ''} onChange={handleInputChange} style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', background: 'white' }} />
              </div>

              <InputField icon={MapPin} label={t("Address")} name="address" value={companyInfo.address} onChange={handleInputChange} />
              <InputField icon={Phone} label={t("Phone Number")} name="phone_number" value={companyInfo.phone_number} onChange={handleInputChange} />
              <InputField icon={Map} label={t("State")} name="state" value={companyInfo.state} onChange={handleInputChange} />
              <InputField icon={ShoppingCart} label={t("Stock Warning (qty)")} name="stock_warning" value={companyInfo.stock_warning} onChange={handleInputChange} type="number" />
              <InputField icon={FileText} label={t("Invoice Greetings")} name="invoice_greetings" value={companyInfo.invoice_greetings} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label={t("SMS API Key")} name="sms_api_key" value={companyInfo.sms_api_key} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label={t("SMS Secret Key")} name="sms_secret_key" value={companyInfo.sms_secret_key} onChange={handleInputChange} type="password" />

              {/* Company logo (multipart field: logo) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                {companyInfo.logo && <img src={companyInfo.logo} alt={t("Logo")} style={{ height: '40px', width: '40px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px' }} />}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px', overflow: 'hidden', maxWidth: '300px', flex: 1 }}>
                  <label style={{ background: '#0ea5e9', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                    {t("Company Logo")}
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleLogoChange} />
                  </label>
                  <span style={{ padding: '8px 16px', fontSize: 'var(--fs-12, 12px)', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rightLogoPreview ? rightLogoPreview.name : (companyInfo.logo ? t("Uploaded") : t("No file chosen"))}
                  </span>
                </div>
              </div>
            </div>
          </form>

          {/* Bottom Interactive Header Logo Cards Section */}
          <div style={{ marginTop: '40px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t("💡 Select Active Header Style (Click any card below to set as active header)")}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Logo 1 Card */}
              <div 
                onClick={() => selectCardAsHeader('card1', logo1Preview)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: activeCard === 'card1' ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: activeCard === 'card1' ? '#f0fdf4' : 'white',
                  boxShadow: activeCard === 'card1' ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
                    <label 
                      onClick={(e) => e.stopPropagation()} 
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      {t("Choose a file")}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo1Preview, 'card1')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo1Preview ? logo1Preview.name : t("No file chosen")}
                    </span>
                  </div>
                  {activeCard === 'card1' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("ACTIVE")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo1Preview ? (
                    <img src={logo1Preview.url} alt={t("Logo 1 Preview")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-32, 32px)', color: 'black' }}>{t("Rajdhani")}</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: 'var(--fs-20, 20px)', color: 'black' }}>{t("Garments")}</h3>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card1', logo1Preview); }} 
                  style={{ background: activeCard === 'card1' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card1' ? t("✓ Active Header") : t("Click to Set Header")}
                </button>
              </div>
              
              {/* Logo 2 Card */}
              <div 
                onClick={() => selectCardAsHeader('card2', logo2Preview)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: activeCard === 'card2' ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: activeCard === 'card2' ? '#f0fdf4' : 'white',
                  boxShadow: activeCard === 'card2' ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
                    <label 
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      {t("Choose a file")}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo2Preview, 'card2')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo2Preview ? logo2Preview.name : t("Set Header Image")}
                    </span>
                  </div>
                  {activeCard === 'card2' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("ACTIVE")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo2Preview ? (
                    <img src={logo2Preview.url} alt={t("Logo 2 Preview")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 'var(--fs-24, 24px)', fontWeight: '900', color: 'black' }}>রাজধানী <span style={{ fontWeight: 'normal' }}>সুপার শপ</span></h2>
                        <p style={{ margin: 0, fontSize: 'var(--fs-9, 9px)', fontWeight: 'bold', color: 'black' }}>নেহা শপিং মল (২য় তলা), আঙ্গার মোড়, কালীগঞ্জ, ঝিনাইদহ।</p>
                        <p style={{ margin: 0, fontSize: 'var(--fs-9, 9px)', fontWeight: 'bold', color: 'black' }}>০১৯৭১-৬৯২১৫০, ০১৭২৭-৯০২৪৯৮</p>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card2', logo2Preview); }} 
                  style={{ background: activeCard === 'card2' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card2' ? t("✓ Active Header") : t("Click to Set Header")}
                </button>
              </div>

              {/* Logo 3 Card */}
              <div 
                onClick={() => selectCardAsHeader('card3', logo3Preview)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: activeCard === 'card3' ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: activeCard === 'card3' ? '#f0fdf4' : 'white',
                  boxShadow: activeCard === 'card3' ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px', overflow: 'hidden' }}>
                    <label 
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      {t("Choose a file")}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo3Preview, 'card3')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: 'var(--fs-11, 11px)', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo3Preview ? logo3Preview.name : t("No file chosen")}
                    </span>
                  </div>
                  {activeCard === 'card3' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("ACTIVE")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo3Preview ? (
                    <img src={logo3Preview.url} alt={t("Logo 3 Preview")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-32, 32px)', color: 'black' }}>{t("Rajdhani")}</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: 'var(--fs-20, 20px)', color: 'black' }}>{t("Super Shop")}</h3>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card3', logo3Preview); }} 
                  style={{ background: activeCard === 'card3' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card3' ? t("✓ Active Header") : t("Click to Set Header")}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon: Icon, label, name, value, onChange, type = "text", placeholder = "" }) => (
  <div style={{ position: 'relative', marginTop: '12px' }}>
    <label style={{ 
      position: 'absolute', 
      top: '-12px', 
      left: '12px', 
      background: '#0ea5e9', 
      color: 'white', 
      padding: '3px 8px', 
      borderRadius: '4px', 
      fontSize: 'var(--fs-10, 10px)', 
      fontWeight: 'bold', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      zIndex: 1
    }}>
      <Icon size={10} color="white" /> {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding: '16px 16px 12px 16px',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        outline: 'none',
        width: '100%',
        fontSize: 'var(--fs-13, 13px)',
        color: 'var(--text-main)',
        background: 'white'
      }}
    />
  </div>
);

export default CompanyInformation;
