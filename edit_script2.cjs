const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

// Replace paddingBottom on dashboard-content
code = code.replace(/<div className="dashboard-content" style=\{\{ paddingBottom: "100px" \}\}>/, '<div className="dashboard-content" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", overflow: "hidden" }}>');

code = code.replace(/<div\s*className="premium-body"\s*style=\{\{ background: "white", padding: "24px" \}\}\s*>/, '<div className="premium-body" style={{ background: "white", padding: "24px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>');

code = code.replace(/<form onSubmit=\{\(e\) => e.preventDefault\(\)\}>/, '<form onSubmit={(e) => e.preventDefault()} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>');

code = code.replace(
    'maxHeight: "450px",',
    'flex: 1,\n                minHeight: "200px",'
);

code = code.replace(
    /marginBottom: "24px",\n\s*borderRadius: "8px",/,
    'marginBottom: "24px",\n                borderRadius: "8px",'
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
