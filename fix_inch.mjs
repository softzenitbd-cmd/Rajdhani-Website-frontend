import fs from 'fs';
let pbContent = fs.readFileSync('src/pages/product/ProductBarcode.jsx', 'utf8');

pbContent = pbContent.replace(
  "width: '100%', height: '100%'",
  "width: '1.5in', height: '1in', border: '1px dashed #cbd5e1'"
);

fs.writeFileSync('src/pages/product/ProductBarcode.jsx', pbContent);
console.log('Fixed size to 1.5in x 1in');
