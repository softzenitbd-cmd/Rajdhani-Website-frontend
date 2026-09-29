const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx', 'utf8');

// Fix the lucide-react import syntax error
code = code.replace(
    /import \{([^}]+) \} , X \} from 'lucide-react';/,
    'import {$1, X} from \'lucide-react\';'
);
// Also just in case the space was different:
code = code.replace(
    /import \{([^}]+)\} , X \} from 'lucide-react';/,
    'import {$1, X} from \'lucide-react\';'
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx', code);
console.log('Fixed syntax error');
