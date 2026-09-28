const fs = require('fs');
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

content = content.replace(
  "padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'",
  "padding: '16px 24px', background: '#22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center'"
);

content = content.replace(
  "fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase'",
  "fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase', color: 'black'"
);

content = content.replace(
  '<div\n                  style={{\n                    position: "absolute",\n                    top: "-10px",\n                    left: "20px",\n                    background: "var(--primary)",\n                    color: "white",\n                    padding: "2px 8px",\n                    fontSize: "var(--fs-10, 10px)",\n                    borderRadius: "4px",\n                    zIndex: 2,\n                  }}\n                >\n                  {t("Barcode Number")}\n                </div>',
  '<BadgeLabel text={t("Barcode Number")} />'
).replace(
  '<div\r\n                  style={{\r\n                    position: "absolute",\r\n                    top: "-10px",\r\n                    left: "20px",\r\n                    background: "var(--primary)",\r\n                    color: "white",\r\n                    padding: "2px 8px",\r\n                    fontSize: "var(--fs-10, 10px)",\r\n                    borderRadius: "4px",\r\n                    zIndex: 2,\r\n                  }}\r\n                >\r\n                  {t("Barcode Number")}\r\n                </div>',
  '<BadgeLabel text={t("Barcode Number")} />'
);

content = content.replace(
  '<div\n                  style={{\n                    display: "flex",\n                    border: "1px solid #e2e8f0",\n                    borderRadius: "4px",\n                    overflow: "hidden",\n                    background: "white",\n                  }}\n                >',
  '<div\n                  style={{\n                    display: "flex",\n                    border: "1px solid #0ea5e9",\n                    borderRadius: "8px",\n                    overflow: "hidden",\n                    background: "white",\n                  }}\n                >'
).replace(
  '<div\r\n                  style={{\r\n                    display: "flex",\r\n                    border: "1px solid #e2e8f0",\r\n                    borderRadius: "4px",\r\n                    overflow: "hidden",\r\n                    background: "white",\r\n                  }}\r\n                >',
  '<div\r\n                  style={{\r\n                    display: "flex",\r\n                    border: "1px solid #0ea5e9",\r\n                    borderRadius: "8px",\r\n                    overflow: "hidden",\r\n                    background: "white",\r\n                  }}\r\n                >'
);

content = content.replace(
  '              <div\n                className="form-group"\n                style={{ marginBottom: "0", position: "relative" }}\n                onKeyDownCapture={(e) => {',
  '              <div\n                className="form-group"\n                style={{ marginBottom: "0", position: "relative", border: "1px solid #0ea5e9", borderRadius: "8px", padding: "1px" }}\n                onKeyDownCapture={(e) => {'
).replace(
  '              <div\r\n                className="form-group"\r\n                style={{ marginBottom: "0", position: "relative" }}\r\n                onKeyDownCapture={(e) => {',
  '              <div\r\n                className="form-group"\r\n                style={{ marginBottom: "0", position: "relative", border: "1px solid #0ea5e9", borderRadius: "8px", padding: "1px" }}\r\n                onKeyDownCapture={(e) => {'
);

content = content.replace(
  '              >\n                <SearchableSelect\n                  id="productSearchDropdown"',
  '              >\n                <BadgeLabel text={t("Product Name")} />\n                <SearchableSelect\n                  id="productSearchDropdown"'
).replace(
  '              >\r\n                <SearchableSelect\r\n                  id="productSearchDropdown"',
  '              >\r\n                <BadgeLabel text={t("Product Name")} />\r\n                <SearchableSelect\r\n                  id="productSearchDropdown"'
);

fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Fixed Barcode section');
