const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx', 'utf8');

// 1. Add showOnScreen={true} to PrintHeader inside the modal
code = code.replace(
    /\{\s*showViewModal && selectedPurchase && \([\s\S]*?<div className="printable-modal-content"[^>]*>[\s\S]*?<PrintHeader \/>/,
    (match) => match.replace('<PrintHeader />', '<PrintHeader showOnScreen={true} />')
);

// 2. Fix the gibberish close button (top right)
code = code.replace(
    /color: '#64748b' \}\}>[^<]+<\/button>/,
    "color: '#64748b' }}><X size={18} /></button>"
);

// 3. Fix the gibberish print button (bottom)
code = code.replace(
    /\{t\("[^"]+Print Memo"\)\}/g,
    '{t("Print Memo")}'
);

// Make sure X is imported if it isn't
if (!code.includes(' X ') && !code.includes(' X,')) {
    code = code.replace(/from 'lucide-react';/, ', X } from \'lucide-react\';');
    code = code.replace(/import \{([^}]+), X \} from 'lucide-react';/, 'import {$1, X} from \'lucide-react\';');
}

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx', code);
console.log('Fixed header and gibberish buttons');
