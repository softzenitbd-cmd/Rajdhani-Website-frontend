const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseReturnList.jsx', 'utf8');

const regex = /<div><strong>\{t\("Grand Total:"\)\}<\/strong>\s*<span[^>]*>.*?<\/span><\/div>/g;

code = code.replace(regex, '');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseReturnList.jsx', code);
console.log('Removed Grand Total line');
