const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

code = code.replace(/fontSize: "var\(--fs-11, 11px\)",\s*color: "#64748b",\s*maxWidth: "80px",/g, 'fontSize: "20px",\n                                  fontWeight: "700",\n                                  color: "#0f172a",\n                                  maxWidth: "150px",');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
