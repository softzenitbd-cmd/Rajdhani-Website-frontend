import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const regex = /const existingIndex = prevItems\.findIndex\(i => String\(i\.id\) === String\(prod\.id\)\);\s*if \(existingIndex > -1\) \{\s*const updated = \[\.\.\.prevItems\];\s*updated\[existingIndex\]\.quantity \+= 1;\s*return updated;\s*\} else \{\s*(return \[\.\.\.prevItems, \{[\s\S]*?\}\];)\s*\}/;

content = content.replace(regex, '$1');

fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Fixed handleSelectProduct to not merge identical products');
