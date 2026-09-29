const fs = require('fs');

function addShareButton(filePath, modalTitleString, invoiceNumberString, selectedObjName) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    // Make sure Share2 is imported
    if (!code.includes(' Share2 ') && !code.includes('Share2,')) {
        code = code.replace(/from 'lucide-react';/, ', Share2 } from \'lucide-react\';');
        code = code.replace(/import \{([^}]+), Share2 \} from 'lucide-react';/, 'import {$1, Share2} from \'lucide-react\';');
    }

    // Prepare share button JSX
    const shareHandler = `
                <button 
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: t("${modalTitleString}"),
                          text: t("Invoice #") + (${invoiceNumberString}),
                          url: window.location.href,
                        });
                      } catch (err) {
                        console.error("Error sharing:", err);
                      }
                    } else {
                      alert(t("Sharing is not supported on this device/browser."));
                    }
                  }} 
                  className="btn" 
                  style={{ background: '#3b82f6', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }}
                >
                  <Share2 size={16} style={{ marginRight: '6px' }} /> {t("Share")}
                </button>
    `;

    // Add before the print button
    code = code.replace(
        /<button onClick=\{[^}]+window\.print\(\)[^>]+\}/g,
        (match) => shareHandler.trim() + '\n                ' + match
    );

    fs.writeFileSync(filePath, code);
    console.log('Added Share button to ' + filePath);
}

addShareButton(
    'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx', 
    'Purchase Invoice Memo', 
    'selectedPurchase.invoice || selectedPurchase.invoiceNo || `PUR-${selectedPurchase.id}`',
    'selectedPurchase'
);

addShareButton(
    'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseReturnList.jsx', 
    'Purchase Return Voucher', 
    'selectedReturn.invoice',
    'selectedReturn'
);

