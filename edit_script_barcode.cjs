const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

const oldStyle = `                                  fontSize: "var(--fs-11, 11px)",
                                  color: "#64748b",
                                  maxWidth: "80px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",`;

const newStyle = `                                  fontSize: "var(--fs-14, 14px)",
                                  fontWeight: "600",
                                  color: "#334155",
                                  maxWidth: "100px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",`;

code = code.replace(oldStyle, newStyle);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
