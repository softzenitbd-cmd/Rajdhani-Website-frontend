const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\CompanyInformation.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const statePattern = /const activeCard = settings\.print_header_card \|\| 'card2';\r?\n\r?\n\s*const \[companyInfo, setCompanyInfo\] = useState/;
if (content.match(statePattern)) {
    const stateRepl = `const activeCard = settings.print_header_card || 'card2';
  const barcodeActiveCard = settings.barcode_header_card || 'card1';

  const [companyInfo, setCompanyInfo] = useState`;
    content = content.replace(statePattern, stateRepl);
}

const pendingCardPattern = /const \[pendingCard, setPendingCard\] = useState\(activeCard\);/;
if (content.match(pendingCardPattern)) {
    const pendingRepl = `const [pendingCard, setPendingCard] = useState(activeCard);
  const [pendingBarcodeCard, setPendingBarcodeCard] = useState(barcodeActiveCard);`;
    content = content.replace(pendingCardPattern, pendingRepl);
}

// 2. Add useEffect
const effectPattern = /useEffect\(\(\) => \{\r?\n\s*setPendingCard\(activeCard\);\r?\n\s*\}, \[activeCard\]\);/;
if (content.match(effectPattern)) {
    const effectRepl = `useEffect(() => {
    setPendingCard(activeCard);
  }, [activeCard]);

  useEffect(() => {
    setPendingBarcodeCard(barcodeActiveCard);
  }, [barcodeActiveCard]);`;
    content = content.replace(effectPattern, effectRepl);
}

// 3. Add save function
const savePattern = /setMessage\(\{ type: 'error', text: err\?\.message \|\| 'Failed to save header selection' \}\);\r?\n\s*\}\r?\n\s*\};/;
if (content.match(savePattern)) {
    const saveRepl = `setMessage({ type: 'error', text: err?.message || 'Failed to save header selection' });
    }
  };

  const saveBarcodeHeaderSettings = async () => {
    try {
      if (pendingBarcodeCard.startsWith('history_')) {
        const idx = parseInt(pendingBarcodeCard.split('_')[1]);
        const customUrl = bannerHistory[idx];
        await updateSettings({ 
          barcode_header_card: pendingBarcodeCard, 
          barcode_header_mode: 'image',
          barcode_header_custom_url: customUrl
        });
      } else {
        await updateSettings({ 
          barcode_header_card: pendingBarcodeCard, 
          barcode_header_mode: 'card',
          barcode_header_custom_url: null
        });
      }
      setMessage({ type: 'success', text: t("Barcode header updated!") });
      toast.success(t("Barcode header style updated"));
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save barcode header selection' });
    }
  };`;
    content = content.replace(savePattern, saveRepl);
}

// 4. Add UI block
const uiPattern = /<CheckCircle size=\{18\} \/> \{t\("Update Header Style"\)\}\r?\n\s*<\/button>\r?\n\s*<\/div>\r?\n\s*<\/div>/;
if (content.match(uiPattern)) {
    const barcodeUI = `
          {/* Barcode Header Banner Selection */}
          <div style={{ marginTop: '40px', paddingBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t("💡 Barcode header change (Click any card below to select, then click Update)")}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Logo 1 Card */}
              <div 
                onClick={() => setPendingBarcodeCard(bannerHistory[0] ? 'history_0' : 'card1')}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: (pendingBarcodeCard === 'history_0' || pendingBarcodeCard === 'card1') ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: (pendingBarcodeCard === 'history_0' || pendingBarcodeCard === 'card1') ? '#f0fdf4' : 'white',
                  boxShadow: (pendingBarcodeCard === 'history_0' || pendingBarcodeCard === 'card1') ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: '#64748b' }}>{bannerHistory[0] ? t("Previous Banner 1") : t("Template 1")}</span>
                  {(pendingBarcodeCard === 'history_0' || pendingBarcodeCard === 'card1') && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("SELECTED")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {bannerHistory[0] ? (
                    <img src={bannerHistory[0]} alt={t("History 1")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-32, 32px)', color: 'black' }}>{t("Rajdhani")}</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: 'var(--fs-20, 20px)', color: 'black' }}>{t("Garments")}</h3>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Logo 2 Card */}
              <div 
                onClick={() => setPendingBarcodeCard(bannerHistory[1] ? 'history_1' : 'card2')}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: (pendingBarcodeCard === 'history_1' || pendingBarcodeCard === 'card2') ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: (pendingBarcodeCard === 'history_1' || pendingBarcodeCard === 'card2') ? '#f0fdf4' : 'white',
                  boxShadow: (pendingBarcodeCard === 'history_1' || pendingBarcodeCard === 'card2') ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: '#64748b' }}>{bannerHistory[1] ? t("Previous Banner 2") : t("Template 2")}</span>
                  {(pendingBarcodeCard === 'history_1' || pendingBarcodeCard === 'card2') && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("SELECTED")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {bannerHistory[1] ? (
                    <img src={bannerHistory[1]} alt={t("History 2")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
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
              </div>

              {/* Logo 3 Card */}
              <div 
                onClick={() => setPendingBarcodeCard(bannerHistory[2] ? 'history_2' : 'card3')}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  border: (pendingBarcodeCard === 'history_2' || pendingBarcodeCard === 'card3') ? '2.5px solid #16a34a' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '12px',
                  background: (pendingBarcodeCard === 'history_2' || pendingBarcodeCard === 'card3') ? '#f0fdf4' : 'white',
                  boxShadow: (pendingBarcodeCard === 'history_2' || pendingBarcodeCard === 'card3') ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: '#64748b' }}>{bannerHistory[2] ? t("Previous Banner 3") : t("Template 3")}</span>
                  {(pendingBarcodeCard === 'history_2' || pendingBarcodeCard === 'card3') && (
                    <span style={{ background: '#16a34a', color: 'white', fontSize: 'var(--fs-10, 10px)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> {t("SELECTED")}
                    </span>
                  )}
                </div>

                <div style={{ height: '140px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {bannerHistory[2] ? (
                    <img src={bannerHistory[2]} alt={t("History 3")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontFamily: 'cursive', margin: 0, fontSize: 'var(--fs-32, 32px)', color: 'black' }}>{t("Rajdhani")}</h2>
                      <h3 style={{ fontFamily: 'cursive', margin: '-8px 0 0 40px', fontSize: 'var(--fs-20, 20px)', color: 'black' }}>{t("Super Shop")}</h3>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button 
                type="button"
                onClick={saveBarcodeHeaderSettings}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.2)' }}
              >
                <CheckCircle size={18} /> {t("Update Barcode Header Style")}
              </button>
            </div>
          </div>
`;
    content = content.replace(uiPattern, (match) => match + barcodeUI);
} else {
    console.log("Could not match UI pattern");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
