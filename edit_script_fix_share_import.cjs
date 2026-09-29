const fs = require('fs');

function fixImportSyntax(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    // Fix bad import syntax
    code = code.replace(
        /import \{([^}]+)\} , Share2 \} from 'lucide-react';/,
        'import {$1, Share2} from \'lucide-react\';'
    );
    
    // Also if there's any stray closing brace before comma
    code = code.replace(
        /\} , Share2 \}/,
        ', Share2 }'
    );

    fs.writeFileSync(filePath, code);
}

fixImportSyntax('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx');
fixImportSyntax('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseReturnList.jsx');

console.log('Fixed syntax');
