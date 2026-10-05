const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\product\\ProductBarcode.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for useAppSettings
if (!content.includes('useAppSettings')) {
    content = content.replace("import { useToast } from '../../context/ToastContext';", "import { useToast } from '../../context/ToastContext';\nimport { useAppSettings } from '../../hooks/useAppSettings';");
}

// 2. Add useAppSettings to BarcodeSticker
const stickerStart = content.indexOf('export const BarcodeSticker = ({ barcodeValue, name, price }) => {');
if (stickerStart !== -1) {
    const hooksEnd = content.indexOf('const svgRef = useRef(null);', stickerStart);
    if (hooksEnd !== -1) {
        content = content.substring(0, hooksEnd + 28) + '\n  const { settings } = useAppSettings();\n  const barcodeBanner = settings?.barcode_header_custom_url;' + content.substring(hooksEnd + 28);
    }
}

// 3. Replace the hardcoded "RAJDHANI GARMENTS" text with the image if available
const headerTextRegex = /<div style=\{\{ fontSize: 'var\(--fs-9, 9px\)', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '2px' \}\}>\s*\{t\("RAJDHANI GARMENTS"\)\}\s*<\/div>/;

const newHeader = `{barcodeBanner ? (
        <div style={{ marginBottom: '2px', display: 'flex', justifyContent: 'center' }}>
          <img src={barcodeBanner} alt="Barcode Header" style={{ maxHeight: '25px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ fontSize: 'var(--fs-9, 9px)', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '2px' }}>
          {t("RAJDHANI GARMENTS")}
        </div>
      )}`;

content = content.replace(headerTextRegex, newHeader);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched ProductBarcode");
