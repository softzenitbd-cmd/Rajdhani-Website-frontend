const fs = require('fs');

const companyPath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\CompanyInformation.jsx';
let companyContent = fs.readFileSync(companyPath, 'utf8');

// 1. Add fields to EMPTY_INFO in CompanyInformation
const emptyInfoPattern = /sms_base_url: '',\r?\n\s*status: true,/;
if (companyContent.match(emptyInfoPattern)) {
    companyContent = companyContent.replace(emptyInfoPattern, `sms_base_url: '',\n  sale_price_auto_generate: false,\n  sale_price_percentage: '0.00',\n  status: true,`);
}

// 2. Add UI to CompanyInformation
const statusPattern = /<div style=\{\{ position: 'relative', marginTop: '12px' \}\}>\r?\n\s*<label style=\{\{ position: 'absolute', top: '-12px', left: '12px'[\s\S]*?>\{t\("Status"\)\}<\/label>/;
if (companyContent.match(statusPattern)) {
    const newUI = `<div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Auto Generate Sale Price")}</label>
                <select
                  name="sale_price_auto_generate"
                  value={companyInfo.sale_price_auto_generate === false || companyInfo.sale_price_auto_generate === 'false' || companyInfo.sale_price_auto_generate === 0 ? 'false' : 'true'}
                  onChange={(e) => setCompanyInfo((prev) => ({ ...prev, sale_price_auto_generate: e.target.value === 'true' }))}
                  style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', color: 'var(--text-main)', background: 'white' }}
                >
                  <option value="true">{t("Enabled")}</option>
                  <option value="false">{t("Disabled")}</option>
                </select>
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Sale Price % Markup")}</label>
                <input
                  type="number"
                  name="sale_price_percentage"
                  value={companyInfo.sale_price_percentage || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 35"
                  style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', color: 'var(--text-main)', background: 'white' }}
                />
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px'`;
    
    // Careful with replacement to not break existing Status UI
    const exactStatusUI = `<div style={{ position: 'relative', marginTop: '12px' }}>\n                <label style={{ position: 'absolute', top: '-12px', left: '12px'`;
    companyContent = companyContent.replace(/<div style=\{\{ position: 'relative', marginTop: '12px' \}\}>\r?\n\s*<label style=\{\{ position: 'absolute', top: '-12px', left: '12px'/g, exactStatusUI); // Normalize line endings before exact replace if needed, or just use string replace.
}
// Alternative safe replace for the UI:
const insertPoint = `              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Status")}</label>`;
const insertText = `              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Auto Gen Sale Price")}</label>
                <select
                  name="sale_price_auto_generate"
                  value={companyInfo.sale_price_auto_generate === false || companyInfo.sale_price_auto_generate === 'false' || companyInfo.sale_price_auto_generate === 0 ? 'false' : 'true'}
                  onChange={(e) => setCompanyInfo((prev) => ({ ...prev, sale_price_auto_generate: e.target.value === 'true' }))}
                  style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', color: 'var(--text-main)', background: 'white' }}
                >
                  <option value="true">{t("Enabled")}</option>
                  <option value="false">{t("Disabled")}</option>
                </select>
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Sale Price % Markup")}</label>
                <input
                  type="number"
                  name="sale_price_percentage"
                  value={companyInfo.sale_price_percentage || ''}
                  onChange={handleInputChange}
                  placeholder="35"
                  style={{ padding: '16px 16px 12px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', fontSize: 'var(--fs-13, 13px)', color: 'var(--text-main)', background: 'white' }}
                />
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Status")}</label>`;

companyContent = companyContent.replace(insertPoint, insertText);
fs.writeFileSync(companyPath, companyContent, 'utf8');

// 3. Patch ProductCreate.jsx
const productPath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\product\\ProductCreate.jsx';
let productContent = fs.readFileSync(productPath, 'utf8');

// import companyStore
if (!productContent.includes('companyStore')) {
    productContent = productContent.replace("import { useAppSettings } from '../../hooks/useAppSettings';", "import { useAppSettings } from '../../hooks/useAppSettings';\nimport { companyStore } from '../../services/companyStore';");
}

// read from companyStore
const settingsPattern = /const autoCalculateSalePrice = !!settings\['sale_price_auto_generate'\];\r?\n\s*const salePricePercentage = Number\(settings\['sale_price_percentage'\]\) \|\| 0;/;
if (productContent.match(settingsPattern)) {
    productContent = productContent.replace(settingsPattern, `const companyInfo = companyStore.getCached();
  const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === 'true';
  const salePricePercentage = Number(companyInfo.sale_price_percentage) || 0;`);
}

fs.writeFileSync(productPath, productContent, 'utf8');
console.log("Patched");
