const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\CompanyInformation.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add uploadBarcodeHeaderImage and handleBarcodeBannerChange
const uploadPattern = /const handleCustomBannerChange = async \(e\) => \{[\s\S]*?\};\r?\n/;
const match = content.match(uploadPattern);
if (match) {
    const newFunctions = `  const uploadBarcodeHeaderImage = async (file) => {
    const currentBanner = settings.print_header_custom_url || companyHeaderImage(companyInfo);
    let newHistory = [...bannerHistory];
    if (currentBanner && !newHistory.includes(currentBanner)) {
      newHistory = [currentBanner, ...newHistory].slice(0, 3);
    }
    
    const formData = new FormData();
    formData.append('memo_header_image', file);
    const saved = await companyStore.save(formData, true);
    if (!companyHeaderImage(saved)) {
      await companyStore.load(true);
    }
    setCompanyInfo((prev) => ({ ...prev, ...companyStore.getCached() }));
    await updateSettings({ 
      barcode_header_mode: 'image',
      barcode_header_card: 'custom_upload',
      barcode_header_custom_url: null,
      banner_history: newHistory
    });
  };

  const handleBarcodeBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadBarcodeHeaderImage(file);
      setMessage({ type: 'success', text: t("Barcode custom banner uploaded and set!") });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to upload barcode custom banner' });
    }
  };
`;
    content = content.replace(match[0], match[0] + '\n' + newFunctions);
}

// 2. Add Upload button to the Barcode Header Section
// The title is <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
// {t("💡 Barcode header change (Click any card below to select, then click Update)")}
// </h4>

// Let's replace the h4 with a flex container holding the title and the upload button
const titlePattern = /<h4 style=\{\{\s*margin: '0 0 16px 0',\s*fontSize: 'var\(--fs-14, 14px\)',\s*fontWeight: 'bold',\s*color: '#1e293b',\s*display: 'flex',\s*alignItems: 'center',\s*gap: '6px'\s*\}\}>\s*\{t\("💡 Barcode header change \(Click any card below to select, then click Update\)"\)\}\s*<\/h4>/;

const newTitle = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {t("💡 Barcode header change (Click any card below to select, then click Update)")}
              </h4>
              <label style={{ background: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> {t("Upload Custom Banner")}
                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleBarcodeBannerChange} />
              </label>
            </div>`;

if (content.match(titlePattern)) {
    content = content.replace(titlePattern, newTitle);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
