const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

// Fix the height so it doesn't push off the screen
code = code.replace(/height: "calc\(100vh - 10px\)"/, 'height: "calc(100vh - 110px)"');

// Fix the table minHeight so it doesn't force an overflow hiding the buy button
code = code.replace(/minHeight: "450px"/g, 'minHeight: "150px"');
code = code.replace(/minHeight: "350px"/g, 'minHeight: "150px"');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Fixed height issues');
