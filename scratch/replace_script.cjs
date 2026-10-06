const fs = require('fs');
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

// Revert minHeight
content = content.replace(/minHeight:\s*"450px"/g, 'minHeight: "200px"');

// Fix overflow for form and parents
// Find this line: <form onSubmit={(e) => e.preventDefault()} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
content = content.replace(/<form([^>]+)overflow:\s*"hidden"([^>]*)>/g, '<form$1overflowY: "auto", overflowX: "hidden"$2>');

// Also fix premium-body
content = content.replace(/<div className="premium-body"([^>]+)overflow:\s*"hidden"([^>]*)>/g, '<div className="premium-body"$1overflowY: "auto", overflowX: "hidden"$2>');

fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Done');
