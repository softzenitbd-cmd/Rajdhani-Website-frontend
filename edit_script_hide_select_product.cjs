const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', 'utf8');

// Adjust grid columns
code = code.replace(
    /gridTemplateColumns: '1\.2fr 1fr 1\.2fr 1fr'/,
    "gridTemplateColumns: '1.2fr 1fr 1fr'"
);

// Remove the Select Product div completely
const selectProductRegex = /<div>\s*<select\s*value=\{filters\.productId\}[\s\S]*?<option value="">\{t\("Select Product"\)\}<\/option>[\s\S]*?<\/select>\s*<\/div>/;

code = code.replace(selectProductRegex, '');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', code);
console.log('Removed Select Product dropdown');
