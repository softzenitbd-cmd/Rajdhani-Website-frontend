const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Just render stock.date because it is already formatted correctly by formatDisplayDate
code = code.replace(
    /\{formatToDDMMYYYY\(stock\.date\)\}/g,
    '{stock.date}'
);

fs.writeFileSync(filePath, code);
console.log('Fixed date format issue');
