const fs = require('fs');

// 1. Revert CompanyInformation.jsx
const companyPath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\CompanyInformation.jsx';
let companyContent = fs.readFileSync(companyPath, 'utf8');

// Remove from EMPTY_INFO
companyContent = companyContent.replace(/sms_base_url: '',\r?\n\s*sale_price_auto_generate: false,\r?\n\s*sale_price_percentage: '0.00',\r?\n\s*status: true,/, "sms_base_url: '',\n  status: true,");

// Remove UI
const uiStartStr = `              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Auto Gen Sale Price")}</label>`;
const uiEndStr = `              <div style={{ position: 'relative', marginTop: '12px' }}>
                <label style={{ position: 'absolute', top: '-12px', left: '12px', background: '#0ea5e9', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 1 }}>{t("Status")}</label>`;

const startIdx = companyContent.indexOf(uiStartStr);
const endIdx = companyContent.indexOf(uiEndStr);

if (startIdx !== -1 && endIdx !== -1) {
    companyContent = companyContent.substring(0, startIdx) + uiEndStr + companyContent.substring(endIdx + uiEndStr.length);
}

fs.writeFileSync(companyPath, companyContent, 'utf8');

// 2. Patch GeneralSettings.jsx
const settingsPath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\settings\\GeneralSettings.jsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

// Import companyStore
if (!settingsContent.includes("import { companyStore }")) {
    settingsContent = settingsContent.replace("import PrintHeader from '../../components/PrintHeader';", "import PrintHeader from '../../components/PrintHeader';\nimport { companyStore } from '../../services/companyStore';");
}

// Add CompanyToggleItem and CompanyInputItem
const componentsToAdd = `
const CompanyToggleItem = ({ label, field, defaultChecked = false }) => {
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());

  useEffect(() => {
    const handleUpdate = () => setCompanyInfo(companyStore.getCached());
    window.addEventListener(companyStore.EVENT, handleUpdate);
    companyStore.load();
    return () => window.removeEventListener(companyStore.EVENT, handleUpdate);
  }, []);

  const checked = companyInfo[field] === undefined ? defaultChecked : (companyInfo[field] === true || companyInfo[field] === 'true');

  const setChecked = (v) => {
    companyStore.save({ [field]: v });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '8px', background: 'white' }}>
      <label style={{ fontSize: 'var(--fs-14, 14px)', color: '#1f2937', cursor: 'pointer', flex: 1 }} onClick={() => setChecked(!checked)}>
        {label}
      </label>
      <div 
        onClick={() => setChecked(!checked)}
        style={{
          width: '44px',
          height: '24px',
          background: checked ? '#3b82f6' : '#e2e8f0',
          borderRadius: '12px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );
};

const CompanyInputItem = ({ label, field, inputValue = "" }) => {
  const [companyInfo, setCompanyInfo] = useState(() => companyStore.getCached());
  const [localValue, setLocalValue] = useState(companyInfo[field] === undefined ? inputValue : companyInfo[field]);

  useEffect(() => {
    const handleUpdate = () => {
        const ci = companyStore.getCached();
        setCompanyInfo(ci);
        setLocalValue(ci[field] === undefined ? inputValue : ci[field]);
    };
    window.addEventListener(companyStore.EVENT, handleUpdate);
    companyStore.load();
    return () => window.removeEventListener(companyStore.EVENT, handleUpdate);
  }, [field, inputValue]);

  const handleBlur = () => {
    companyStore.save({ [field]: localValue });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '8px', background: 'white' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <label style={{ fontSize: 'var(--fs-11, 11px)', color: 'white', background: '#3b82f6', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
          {label}
        </label>
        <input 
          type="text" 
          value={localValue} 
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          style={{ border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '4px 0', fontSize: 'var(--fs-14, 14px)' }} 
        />
      </div>
    </div>
  );
};
`;

if (!settingsContent.includes("CompanyToggleItem")) {
    const insertPoint = `const ToggleItem = ({ label,`;
    settingsContent = settingsContent.replace(insertPoint, componentsToAdd + "\n" + insertPoint);
}

// Modify the Product tab section
// Old: 
// <ToggleItem label={t("New Price Sale Only")} defaultChecked={true} />
// <ToggleItem label={t("Sale Price Percentage")} hasInput={true} inputValue="35.00" />
// New:
// <CompanyToggleItem label={t("Auto Gen Sale Price")} field="sale_price_auto_generate" />
// <CompanyInputItem label={t("Sale Price Percentage")} field="sale_price_percentage" inputValue="0.00" />

const oldProductSection = `<ToggleItem label={t("New Price Sale Only")} defaultChecked={true} />
                    <ToggleItem label={t("Sale Price Percentage")} hasInput={true} inputValue="35.00" />`;
const newProductSection = `<ToggleItem label={t("New Price Sale Only")} defaultChecked={true} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <CompanyToggleItem label={t("Auto Gen Sale Price")} field="sale_price_auto_generate" />
                    <CompanyInputItem label={t("Sale Price Percentage")} field="sale_price_percentage" inputValue="0.00" />`;

settingsContent = settingsContent.replace(oldProductSection, newProductSection);

fs.writeFileSync(settingsPath, settingsContent, 'utf8');

console.log("Reverted company info UI and patched general settings UI");
