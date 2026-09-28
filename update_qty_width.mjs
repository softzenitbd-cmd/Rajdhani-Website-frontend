import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');
content = content.replace(/width: '60px'/g, "width: '100px'");
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Fixed quantity width.');
