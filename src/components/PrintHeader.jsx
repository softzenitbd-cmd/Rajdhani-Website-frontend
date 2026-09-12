import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { settingService } from '../services/settingService';

const PrintHeader = () => {
  const [activeCard, setActiveCard] = useState(() => {
    return localStorage.getItem('companyActiveCard') || 'card2';
  });

  const [headerImage, setHeaderImage] = useState(() => {
    return localStorage.getItem('companyHeaderImage') || '';
  });

  const [headerMode, setHeaderMode] = useState(() => {
    return localStorage.getItem('companyHeaderMode') || 'card';
  });

  const [companyInfo, setCompanyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('companyInfoData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const defaultInfo = {
    company_name: 'রাজধানী গার্মেন্টস',
    shortname: 'RAJDHANI',
    address: 'নেহা শপিং মল (২য় তলা), আঙ্গার মোড়, কালীগঞ্জ, ঝিনাইদহ।',
    phone_number: '০১৯৭১-৬৯২১৫০, ০১৭২৭-৯০২৪৯৮',
    invoice_greetings: 'বিসমিল্লাহির রাহমানির রাহিম'
  };

  const info = { ...defaultInfo, ...(companyInfo || {}) };

  const syncData = () => {
    const card = localStorage.getItem('companyActiveCard');
    if (card) setActiveCard(card);

    const mode = localStorage.getItem('companyHeaderMode');
    if (mode) setHeaderMode(mode);

    const savedImg = localStorage.getItem('companyHeaderImage');
    if (savedImg) setHeaderImage(savedImg);

    try {
      const savedInfo = localStorage.getItem('companyInfoData');
      if (savedInfo) setCompanyInfo(JSON.parse(savedInfo));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    syncData();

    window.addEventListener('companyHeaderUpdated', syncData);
    window.addEventListener('storage', syncData);

    settingService.getCompanyInfo().then(res => {
      const data = res?.data || res || {};
      if (data && Object.keys(data).length > 0) {
        setCompanyInfo(prev => {
          const merged = { ...prev, ...data };
          localStorage.setItem('companyInfoData', JSON.stringify(merged));
          return merged;
        });

        const img = data.print_header || data.header_image || data.logo || data.banner;
        if (img) {
          localStorage.setItem('companyHeaderImage', img);
          setHeaderImage(img);
        }
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('companyHeaderUpdated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, []);

  // 1. If an image is explicitly set/uploaded for the current header or mode is 'image'
  if (headerMode === 'image' && headerImage) {
    return (
      <div className="receipt-header-image" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <img 
          src={headerImage} 
          alt="Rajdhani Banner" 
          style={{ 
            maxWidth: '100%', 
            height: 'auto', 
            maxHeight: '180px',
            display: 'block', 
            margin: '0 auto',
            borderRadius: '4px',
            objectFit: 'contain'
          }} 
        />
      </div>
    );
  }

  // 2. If Card 1 (Rajdhani Garments) is selected
  if (activeCard === 'card1') {
    return (
      <div className="receipt-header-text" style={{ border: '2px solid #000', borderRadius: '8px', padding: '16px 24px', background: 'white', textAlign: 'center', margin: '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '36px', color: 'black' }}>Rajdhani</h2>
        <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '24px', color: 'black' }}>Garments</h3>
      </div>
    );
  }

  // 3. If Card 3 (Rajdhani Super Shop English) is selected
  if (activeCard === 'card3') {
    return (
      <div className="receipt-header-text" style={{ border: '2px solid #000', borderRadius: '8px', padding: '16px 24px', background: 'white', textAlign: 'center', margin: '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '36px', color: 'black' }}>Rajdhani</h2>
        <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '24px', color: 'black' }}>Super Shop</h3>
      </div>
    );
  }

  // 4. Default: Card 2 / Dynamic Shop Header (রাজধানী সুপার শপ + Cart Icon + Address + Phone)
  return (
    <div className="receipt-header-text" style={{ 
      border: '2px solid #000', 
      borderRadius: '8px', 
      padding: '16px 24px', 
      background: 'white', 
      textAlign: 'center', 
      margin: '0 auto 20px auto', 
      maxWidth: '850px'
    }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'black', marginBottom: '8px' }}>
        {info.invoice_greetings || 'বিসমিল্লাহির রাহমানির রাহিম'}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={24} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'black' }}>
            {info.company_name || 'রাজধানী'} <span style={{ fontWeight: 'normal' }}>সুপার শপ</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: 'black' }}>
            {info.address || info.present_address || 'নেহা শপিং মল (২য় তলা), আঙ্গার মোড়, কালীগঞ্জ, ঝিনাইদহ।'}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: 'black' }}>
            {info.phone_number || '০১৯৭১-৬৯২১৫০, ০১৭২৭-৯০২৪৯৮'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
