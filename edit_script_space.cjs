const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

// Increase minHeight of table and reduce margin
code = code.replace(
    'minHeight: "200px",\n                  border: "1px solid #e2e8f0",\n                  marginBottom: "24px",',
    'minHeight: "350px",\n                  border: "1px solid #e2e8f0",\n                  marginBottom: "16px",'
);

// Decrease padding on premium-body
code = code.replace(
    '<div className="premium-body" style={{ background: "white", padding: "24px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>',
    '<div className="premium-body" style={{ background: "white", padding: "16px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>'
);

// Decrease margin on top row form grid
code = code.replace(
    /gap: "16px",\n\s*marginBottom: "16px",\n\s*flexWrap: "wrap",/,
    'gap: "16px",\n                marginBottom: "12px",\n                flexWrap: "wrap",'
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
