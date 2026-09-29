const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Ensure Share2 is imported
if (!code.includes('Share2')) {
    code = code.replace(
        /import \{([^}]+)\} from 'lucide-react';/,
        'import {$1, Share2} from \'lucide-react\';'
    );
}

const shareButton = `
              <button onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: t("Stock List"),
                        url: window.location.href,
                      });
                    } catch (err) {
                      console.error("Error sharing:", err);
                    }
                  } else {
                    alert(t("Sharing is not supported on this device/browser."));
                  }
                }} 
                className="btn" style={{ background: '#3b82f6', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                <Share2 size={15} /> {t("Share")}
              </button>
`;

// Insert after the Print button
code = code.replace(
    /(<button onClick=\{\(\) => window\.print\(\)\}[^>]+>[\s\S]*?<Printer size=\{15\} \/> \{t\("Print"\)\}\s*<\/button>)/,
    '$1' + shareButton
);

fs.writeFileSync(filePath, code);
console.log('Added share button to Stock List');
