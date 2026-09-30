import fs from 'fs';

let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const regex = /<div style=\{\{ display: "flex", gap: "12px" \}\}>[\s\S]*?\{t\("Submit Purchase"\)\}\s*<\/button>\s*<\/div>/;

const newButtons = `
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="butto
                n"
                className="btn-primary"
                onClick={() => handleSubmitPurchase(1)}
                disabled={submitting}
                style={{ background: "var(--success)", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", borderRadius: "4px", fontWeight: "bold", border: 'none', cursor: 'pointer', color: 'white' }}
              >
                {t("Buy")}
              </button>
            </div>`;

content = content.replace(regex, newButtons.trim());
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Replaced buttons with a single Buy button');
