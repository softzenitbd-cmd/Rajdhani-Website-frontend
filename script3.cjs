const fs = require('fs');

let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const targetStr = `            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                flex: 1,
                minHeight: "150px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            >`;

const replacementStr = `            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                flex: 1,
                minHeight: "350px",
                maxHeight: "500px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            >`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
