const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

code = code.replace(
    /quantity: Number\(prod\.stock \|\| prod\.opening_stock \|\| 1\),/,
    'quantity: 0,'
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
