const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

// Update dashboard-content height to be larger
code = code.replace(/height: "calc\(100vh - 80px\)"/, 'height: "calc(100vh - 10px)"');

// Force the table to have a larger min-height and flex grow
code = code.replace(/minHeight: "200px"/g, 'minHeight: "450px"');
code = code.replace(/minHeight: "350px"/g, 'minHeight: "450px"');

// Reduce gap between form fields
code = code.replace(/gap: "16px",\n\s*marginBottom: "12px",/g, 'gap: "12px",\n                marginBottom: "8px",');
code = code.replace(/marginBottom: "24px",\n\s*borderRadius: "8px",/g, 'marginBottom: "12px",\n                borderRadius: "8px",');

// Reduce bottom field margins
code = code.replace(/gap: "24px",\n\s*flexWrap: "wrap",\n\s*marginBottom: "24px",/g, 'gap: "16px",\n                flexWrap: "wrap",\n                marginBottom: "8px",');

// Remove extra top margin from footer
code = code.replace(/marginTop: "24px",\s*position: "relative"/g, 'marginTop: "8px", position: "relative"');

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
