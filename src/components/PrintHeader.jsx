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
const readPrefs = () => {
  const info = companyStore.getCached();
  const defaultMode = companyHeaderImage(info) ? 'image' : 'card';
  return {
    activeCard: appSettingsService.get('print_header_card', 'card2'),
    headerMode: appSettingsService.get('print_header_mode', defaultMode),
    customUrl: appSettingsService.get('print_header_custom_url', null),
  };
};

const PrintHeader = ({ showOnScreen = false, isPos = false }) => {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(readPrefs);
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());
  // A banner that cannot be loaded must not leave a broken-image icon on every
  // report — fall back to the text header instead.
  const [bannerFailed, setBannerFailed] = useState(false);

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
  const { activeCard, headerMode, customUrl } = prefs;
  const headerImage = customUrl || companyHeaderImage(info);

  // A newly uploaded banner deserves a fresh attempt.
  useEffect(() => {
    setBannerFailed(false);
  }, [headerImage]);

  const visibilityClass = showOnScreen ? '' : ' print-only';

  // 1. Uploaded banner image
  if (headerMode === 'image' && headerImage && !bannerFailed) {
    return (
      <div className={`receipt-header-image${visibilityClass}`} style={{ marginBottom: isPos ? '8px' : '20px', textAlign: 'center' }}>
        <img
          src={headerImage}
          alt={info.company_name || t("Company banner")}
          onError={() => setBannerFailed(true)}
          style={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '240px',
            display: 'block',
            margin: '0 auto',
            borderRadius: '4px',
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  // 2. Card 1 - cursive "Rajdhani Garments"
  if (activeCard === 'card1') {
    return (
      <div className={`receipt-header-text${visibilityClass}`} style={{ border: isPos ? 'none' : '2px solid #000', borderRadius: isPos ? '0' : '8px', padding: isPos ? '4px 0' : '16px 24px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: isPos ? '0 auto 8px auto' : '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-36, 36px)', color: 'black', fontWeight: 'bold', display: 'block' }}>{info.company_name || t("Rajdhani")}</h2>
        <h3 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-24, 24px)', color: 'black', display: 'block' }}>{info.company_type || t("Garments")}</h3>
      </div>
    );
  }

  // 3. Card 3 - cursive "Rajdhani Super Shop"
  if (activeCard === 'card3') {
    return (
      <div className={`receipt-header-text${visibilityClass}`} style={{ border: isPos ? 'none' : '2px solid #000', borderRadius: isPos ? '0' : '8px', padding: isPos ? '4px 0' : '16px 24px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: isPos ? '0 auto 8px auto' : '0 auto 20px auto', maxWidth: '800px' }}>
        <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-36, 36px)', color: 'black', fontWeight: 'bold', display: 'block' }}>{info.company_name || t("Rajdhani")}</h2>
        <h3 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-24, 24px)', color: 'black', display: 'block' }}>{t("Super Shop")}</h3>
      </div>
    );
  }

  // 4. Default: Card 2 – company name + address + phone from the API
  return (
    <div className={`receipt-header-text receipt-header-card${visibilityClass}`} style={{
      border: isPos ? 'none' : '2px solid #000',
      borderRadius: isPos ? '0' : '8px',
      padding: isPos ? '4px 0' : '12px 20px',
      background: 'white',
      textAlign: 'center',
      margin: isPos ? '0 auto 8px auto' : '0 auto 16px auto',
      maxWidth: '850px'
    }}>
      {info.invoice_greetings && (
        <div className="receipt-header-greetings" style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', color: 'black', marginBottom: '6px' }}>
          {info.invoice_greetings}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', margin: '6px 0' }}>
        <div className="receipt-header-logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px dashed black', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShoppingCart size={20} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 className="receipt-header-title" style={{ margin: 0, fontSize: 'var(--fs-28, 28px)', fontWeight: '900', color: 'black', lineHeight: '1.2' }}>
            {info.company_name || ''}
          </h2>
          {(info.address || info.present_address) && (
            <p className="receipt-header-subtext" style={{ margin: '3px 0 0 0', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: 'black' }}>
              {info.address || info.present_address}
            </p>
          )}
          {(info.phone_number || info.phone) && (
            <p className="receipt-header-subtext" style={{ margin: '2px 0 0 0', fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: 'black' }}>
              {info.phone_number || info.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
