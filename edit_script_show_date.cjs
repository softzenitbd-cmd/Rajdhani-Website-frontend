const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

const dateBlockRegex = /\{visibleFields\.date !== false && \(\s*<div\s*className="form-group"[\s\S]*?<input[\s\S]*?className="input-date"[\s\S]*?\/>\s*<\/div>\s*\)\}/;

const extractedDateBlock = code.match(dateBlockRegex);
if (extractedDateBlock) {
    let unconditionedDate = extractedDateBlock[0]
        .replace('{visibleFields.date !== false && (', '')
        .replace(/(<\/div>\s*)\)\}$/, '$1');
    
    code = code.replace(dateBlockRegex, unconditionedDate);
    fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
    console.log('Done');
} else {
    console.log('Could not find date block.');
}
