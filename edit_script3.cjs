const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

code = code.replace(/<div className="premium-card">/, '<div className="premium-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Fixed premium-card');
