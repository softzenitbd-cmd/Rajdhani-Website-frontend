import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { companyStore, companyHeaderImage } from '../services/companyStore';
import { appSettingsService } from '../services/appSettingsService';
import { useTranslation } from 'react-i18next';

/**
 * Company header printed on top of every list / report / voucher.
 *
 * Data sources (no localStorage):
 *  - company name / address / phone  → /api/erpsetting/company-info/ (companyStore)
 *  - header style (card1|card2|card3), mode (card|image) and banner URL
 *      → general settings keys `print_header_card`, `print_header_mode`
 *        (banner image = company-info `memo_header_image`)
 */
const readPrefs = () => ({
  activeCard: appSettingsService.get('print_header_card', 'card2'),
  headerMode: appSettingsService.get('print_header_mode', 'card'),
});

const PrintHeader = () => {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(readPrefs);
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());

  useEffect(() => {
    const syncPrefs = () => setPrefs(readPrefs());
    const syncCompany = () => setCompanyInfo({ ...companyStore.getCached() });
    window.addEventListener(appSettingsService.EVENT, syncPrefs);
    window.addEventListener(companyStore.EVENT, syncCompany);
    appSettingsService.load().then(syncPrefs);
    companyStore.load().then(syncCompany);
    return () => {
      window.removeEventListener(appSettingsService.EVENT, syncPrefs);
      window.removeEventListener(companyStore.EVENT, syncCompany);
    };
  }, []);

  const info = companyInfo || {};
  const headerImage = companyHeaderImage(info);
  const { activeCard, headerMode } = prefs;

  // 1. Uploaded banner image
  if (headerMode === 'image' && headerImage) {
    return (
      <div className="receipt-header-image" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <img
          src={headerImage}
          alt={info.company_name || t("Company banner")}
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

  // 2. Card 1 – cursive "Rajdhani Garments"
  if (activeCard === 'card1') {
    return (
      <div className="receipt-header-text" style={{ border: '2px solid #000', borderRadius: '8px', padding: '16px 24px', background: 'white', textAlign: 'center', margin: '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '36px', color: 'black' }}>{info.company_name || t("Rajdhani")}</h2>
        <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '24px', color: 'black' }}>{info.company_type || t("Garments")}</h3>
      </div>
    );
  }

  // 3. Card 3 – cursive "Rajdhani Super Shop"
  if (activeCard === 'card3') {
    return (
      <div className="receipt-header-text" style={{ border: '2px solid #000', borderRadius: '8px', padding: '16px 24px', background: 'white', textAlign: 'center', margin: '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: '36px', color: 'black' }}>{info.company_name || t("Rajdhani")}</h2>
        <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: '24px', color: 'black' }}>{t("Super Shop")}</h3>
      </div>
    );
  }

  // 4. Default: Card 2 – company name + address + phone from the API
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
      {info.invoice_greetings && (
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'black', marginBottom: '8px' }}>
          {info.invoice_greetings}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={24} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'black' }}>
            {info.company_name || ''}
          </h2>
          {(info.address || info.present_address) && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: 'black' }}>
              {info.address || info.present_address}
            </p>
          )}
          {(info.phone_number || info.phone) && (
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: 'black' }}>
              {info.phone_number || info.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
