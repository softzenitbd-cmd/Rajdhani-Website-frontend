import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

content = content.replace(
  'handleSelectProduct(newProd.id);',
  'if (!newProd.id) newProd.id = Date.now().toString(); handleSelectProduct(newProd.id, newProd);'
);

content = content.replace(
  'quantity: 1,',
  'quantity: Number(prod.stock || prod.opening_stock || 1),'
);

fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Restored handleSelectProduct and quantity fixes');
