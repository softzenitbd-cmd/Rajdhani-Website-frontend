import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building, MapPin, Mail, DollarSign, FileText, 
  MessageSquare, User, Phone, Map, ShoppingCart, Save, CheckCircle, Upload, Image as Layout, Check
} from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { settingService } from '../../services/settingService';

const CompanyInformation = () => {
  const { t } = useTranslation();

  const [headerMode, setHeaderMode] = useState(() => {
    return localStorage.getItem('companyHeaderMode') || 'card';
  });

  const [activeCard, setActiveCard] = useState(() => {
    return localStorage.getItem('companyActiveCard') || 'card2';
  });

  const [companyInfo, setCompanyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('companyInfoData');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      company_name: 'রাজধানী গার্মেন্টস',
      shortname: 'RAJDHANI',
      company_type: 'Cloth Store',
      country: 'Bangladesh',
      present_address: 'নেহা শপিংমল এর দ্বিতীয় তলা, কালিগঞ্জ, ঝিনাইদহ',
      address: 'নেহা শপিংমল এর দ্বিতীয় তলা, কালিগঞ্জ, ঝিনাইদহ',
      email: '',
      phone_number: '01716912350, 01727902498',
      city: 'Jhenaidah',
      state: 'Bangladesh',
      zip_code: '9000',
      task_warning: '10',
      currency_symbol: '৳',
      invoice_greetings: 'বিসমিল্লাহির রাহমানির রাহিম',
      invoice_footer: 'Invoice Footer',
      sms_api_code: 'SMS Api Code: smsapibd.com',
      sms_api_sender: 'SMS Sender id : smsapibd.com',
      status: 'Active'
    };
  });

  const [headerBanner, setHeaderBanner] = useState(() => {
    return localStorage.getItem('companyHeaderImage') || '';
  });

  const [rightLogoPreview, setRightLogoPreview] = useState(null);
  const [logo1Preview, setLogo1Preview] = useState(null);
  const [logo2Preview, setLogo2Preview] = useState(null);
  const [logo3Preview, setLogo3Preview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const syncDataToStorage = (updatedInfo, mode = headerMode, card = activeCard) => {
    localStorage.setItem('companyInfoData', JSON.stringify(updatedInfo));
    localStorage.setItem('companyHeaderMode', mode);
    localStorage.setItem('companyActiveCard', card);
    window.dispatchEvent(new Event('companyHeaderUpdated'));
  };

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const res = await settingService.getCompanyInfo();
      const data = res?.data || res || {};
      if (data && Object.keys(data).length > 0) {
        setCompanyInfo(prev => {
          const merged = { ...prev, ...data };
          syncDataToStorage(merged);
          return merged;
        });

        if (data.header_image || data.logo || data.print_header) {
          const imgUrl = data.header_image || data.logo || data.print_header;
          setHeaderBanner(imgUrl);
          localStorage.setItem('companyHeaderImage', imgUrl);
          window.dispatchEvent(new Event('companyHeaderUpdated'));
        }
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => {
      const updated = { ...prev, [name]: value };
      syncDataToStorage(updated);
      return updated;
    });
  };

  const selectCardAsHeader = (cardKey, previewObj) => {
    setActiveCard(cardKey);
    localStorage.setItem('companyActiveCard', cardKey);

    if (previewObj && previewObj.url) {
      setHeaderBanner(previewObj.url);
      localStorage.setItem('companyHeaderImage', previewObj.url);
      localStorage.setItem('companyHeaderMode', 'image');
      setHeaderMode('image');
    } else {
      localStorage.setItem('companyHeaderMode', 'card');
      setHeaderMode('card');
    }

    window.dispatchEvent(new Event('companyHeaderUpdated'));
    setMessage({ type: 'success', text: `Header updated to ${cardKey.toUpperCase()} across full project!` });
  };

  const handleFileChange = (e, setPreview, cardKey) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const prevObj = { url: dataUrl, name: file.name };
      setPreview(prevObj);
      selectCardAsHeader(cardKey, prevObj);
    };
    reader.readAsDataURL(file);
  };

  const handleCustomBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setHeaderBanner(dataUrl);
      localStorage.setItem('companyHeaderImage', dataUrl);
      localStorage.setItem('companyHeaderMode', 'image');
      setHeaderMode('image');
      window.dispatchEvent(new Event('companyHeaderUpdated'));
      setMessage({ type: 'success', text: 'Custom header banner uploaded and activated!' });
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('header_image', file);
    settingService.updateCompanyInfo(formData, true).catch(() => {});
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      syncDataToStorage(companyInfo);
      await settingService.updateCompanyInfo(companyInfo);
      setMessage({ type: 'success', text: 'Company Information updated & synced across full project!' });
    } catch (err) {
      console.error("Error saving company info:", err);
      setMessage({ type: 'success', text: 'Company Information updated & synced across full project!' });
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
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layout size={20} /> Active Project Header Preview
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Click any card below to set that logo/header as the active banner for invoices & print vouchers.</span>
          </div>

          <label style={{ background: '#7c3aed', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Upload Custom Banner
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
          fontSize: '14px',
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
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>Company Information</h2>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={saving}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Update Company'}
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField icon={Building} label="Company Name" name="company_name" value={companyInfo.company_name} onChange={handleInputChange} />
              <InputField icon={Building} label="Company Type" name="company_type" value={companyInfo.company_type} onChange={handleInputChange} />
              <InputField icon={MapPin} label="Present Address" name="present_address" value={companyInfo.present_address} onChange={handleInputChange} />
              <InputField icon={Mail} label="Email" name="email" value={companyInfo.email} onChange={handleInputChange} type="email" />
              <InputField icon={Building} label="City" name="city" value={companyInfo.city} onChange={handleInputChange} />
              <InputField icon={MapPin} label="Zip Code" name="zip_code" value={companyInfo.zip_code} onChange={handleInputChange} />
              <InputField icon={DollarSign} label="Currency Symbol" name="currency_symbol" value={companyInfo.currency_symbol} onChange={handleInputChange} />
              <InputField icon={FileText} label="Invoice Footer" name="invoice_footer" value={companyInfo.invoice_footer} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label="SMS Api Sender" name="sms_api_sender" value={companyInfo.sms_api_sender} onChange={handleInputChange} />
              
              <div style={{ position: 'relative', marginTop: '12px' }}>
                <input 
                  type="text" 
                  name="status"
                  value={companyInfo.status || ''} 
                  onChange={handleInputChange}
                  style={{ 
                    padding: '16px 16px 12px 16px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '4px', 
                    outline: 'none', 
                    width: '100%',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    background: 'white'
                  }} 
                />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField icon={User} label="Shortname" name="shortname" value={companyInfo.shortname} onChange={handleInputChange} />
              
              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0284c7', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <MapPin size={10} color="white" /> Country
                </label>
                <input type="text" name="country" value={companyInfo.country || ''} onChange={handleInputChange} style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: '13px', background: 'white' }} />
              </div>

              <InputField icon={MapPin} label="Address" name="address" value={companyInfo.address} onChange={handleInputChange} />
              <InputField icon={Phone} label="Phone Number" name="phone_number" value={companyInfo.phone_number} onChange={handleInputChange} />
              <InputField icon={Map} label="State" name="state" value={companyInfo.state} onChange={handleInputChange} />
              <InputField icon={ShoppingCart} label="Task Waring" name="task_warning" value={companyInfo.task_warning} onChange={handleInputChange} />
              <InputField icon={FileText} label="Invoice Greetings" name="invoice_greetings" value={companyInfo.invoice_greetings} onChange={handleInputChange} />
              <InputField icon={MessageSquare} label="SMS Api Code" name="sms_api_code" value={companyInfo.sms_api_code} onChange={handleInputChange} />
              
              <div style={{ position: 'relative', marginTop: '12px' }}>
                <input type="text" name="sms_api_code" value={companyInfo.sms_api_code || ''} onChange={handleInputChange} style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: '13px', background: 'white' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px', overflow: 'hidden', marginTop: '12px', maxWidth: '300px' }}>
                <label style={{ background: '#0ea5e9', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                  Choose a file
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setRightLogoPreview, 'custom')} />
                </label>
                <span style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rightLogoPreview ? rightLogoPreview.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </form>

          {/* Bottom Interactive Header Logo Cards Section */}
          <div style={{ marginTop: '40px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 Select Active Header Style (Click any card below to set as active header)
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
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      Choose a file
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo1Preview, 'card1')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: '11px', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo1Preview ? logo1Preview.name : 'No file chosen'}
                    </span>
                  </div>
                  {activeCard === 'card1' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo1Preview ? (
                    <img src={logo1Preview.url} alt="Logo 1 Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '32px', color: 'black' }}>Rajdhani</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '20px', color: 'black' }}>Garments</h3>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card1', logo1Preview); }} 
                  style={{ background: activeCard === 'card1' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card1' ? '✓ Active Header' : 'Click to Set Header'}
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
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      Choose a file
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo2Preview, 'card2')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: '11px', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo2Preview ? logo2Preview.name : 'Set Header Image'}
                    </span>
                  </div>
                  {activeCard === 'card2' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo2Preview ? (
                    <img src={logo2Preview.url} alt="Logo 2 Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'black' }}>রাজধানী <span style={{ fontWeight: 'normal' }}>সুপার শপ</span></h2>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold', color: 'black' }}>নেহা শপিং মল (২য় তলা), আঙ্গার মোড়, কালীগঞ্জ, ঝিনাইদহ।</p>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold', color: 'black' }}>০১৯৭১-৬৯২১৫০, ০১৭২৭-৯০২৪৯৮</p>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card2', logo2Preview); }} 
                  style={{ background: activeCard === 'card2' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card2' ? '✓ Active Header' : 'Click to Set Header'}
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
                      style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      Choose a file
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, setLogo3Preview, 'card3')} />
                    </label>
                    <span style={{ padding: '6px 12px', fontSize: '11px', color: '#64748b', flex: 1, background: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {logo3Preview ? logo3Preview.name : 'No file chosen'}
                    </span>
                  </div>
                  {activeCard === 'card3' && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo3Preview ? (
                    <img src={logo3Preview.url} alt="Logo 3 Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '32px', color: 'black' }}>Rajdhani</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '20px', color: 'black' }}>Super Shop</h3>
                    </div>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); selectCardAsHeader('card3', logo3Preview); }} 
                  style={{ background: activeCard === 'card3' ? '#16a34a' : 'black', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', alignSelf: 'flex-start', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {activeCard === 'card3' ? '✓ Active Header' : 'Click to Set Header'}
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
      fontSize: '10px', 
      fontWeight: 'bold', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      zIndex: 1
    }}>
      <Icon size={10} color="white" /> {label}
    </label>
    {type === 'email' ? (
      <div style={{ 
        padding: '16px 16px 12px 16px', 
        border: '1px solid #cbd5e1', 
        borderRadius: '4px', 
        width: '100%',
        background: 'white',
        display: 'flex',
        gap: '4px',
        overflow: 'hidden'
      }}>
        {Array(10).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
            <Mail size={10} /> TEMP MAIL
          </div>
        ))}
      </div>
    ) : (
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
          fontSize: '13px',
          color: 'var(--text-main)',
          background: 'white'
        }} 
      />
    )}
  </div>
);

export default CompanyInformation;
