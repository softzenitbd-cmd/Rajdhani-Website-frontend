const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

// Remove accounts field
const accountBlockRegex = /\{\s*visibleFields\.accounts !== false && \(\s*<div[\s\S]*?<BadgeLabel text=\{t\("Account"\)\} \/>[\s\S]*?<\/div>\s*\)\}/g;
code = code.replace(accountBlockRegex, '');

// Shrink left column form fields
const leftColumnRegex = /flex: "1 1 500px",\s*display: "grid",\s*gridTemplateColumns: "1fr 1fr",\s*gap: "24px",\s*alignContent: "start",/;
code = code.replace(leftColumnRegex, 'flex: "0 1 500px",\n                  display: "grid",\n                  gridTemplateColumns: "1fr 1fr",\n                  gap: "16px",\n                  alignContent: "start",');

// Also decrease the padding inside these inputs to make them smaller
code = code.replace(/padding: "16px",\n\s*border: "none",\n\s*outline: "none",\n\s*background: "transparent",/g, 'padding: "10px",\n                          border: "none",\n                          outline: "none",\n                          background: "transparent",');

code = code.replace(/padding: "16px",\n\s*border: "none",\n\s*background: "transparent",\n\s*outline: "none",/g, 'padding: "10px",\n                          border: "none",\n                          background: "transparent",\n                          outline: "none",');


fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
