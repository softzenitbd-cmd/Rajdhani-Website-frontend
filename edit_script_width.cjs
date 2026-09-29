const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

const old_totals = `              {/* Right Column totals */}
              <div
                style={{
                  flex: "1 1 300px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >`;

const new_totals = `              {/* Right Column totals */}
              <div
                style={{
                  flex: "0 1 300px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginLeft: "auto",
                }}
              >`;

code = code.replace(old_totals, new_totals);
if (code.indexOf(new_totals) === -1) {
    code = code.replace(old_totals.replace(/\n/g, '\r\n'), new_totals.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
