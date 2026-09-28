import fs from 'fs';
let content = fs.readFileSync('src/components/AddProductModal.jsx', 'utf8');

content = content.replace('name="name"', 'tabIndex="1" name="name" autoFocus');
content = content.replace('name="buying_price"', 'tabIndex="2" name="buying_price"');
content = content.replace('name="selling_price"', 'tabIndex="3" name="selling_price"');
content = content.replace('name="opening_stock"', 'tabIndex="4" name="opening_stock"');
content = content.replace('name="unit"', 'tabIndex="5" name="unit"');
content = content.replace('name="group"', 'tabIndex="6" name="group"');
content = content.replace('type="submit"', 'tabIndex="7" type="submit"');

fs.writeFileSync('src/components/AddProductModal.jsx', content);
console.log('Added tabIndex to AddProductModal');
