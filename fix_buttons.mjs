import fs from 'fs';

const content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');
const lines = content.split('\n');

const submitIndex = lines.findIndex(l => l.includes('{t("Submit Purchase")}'));
let startIndex = submitIndex;
while(startIndex > 0 && !lines[startIndex].includes('<div style={{ display: "flex", gap: "12px" }}>')) {
  startIndex--;
}
const endIndex = submitIndex + 3; // roughly </div> after the button

const newLines = `
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSubmitPurchase(1)}
                disabled={submitting}
                style={{ background: "var(--success)", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", borderRadius: "4px", fontWeight: "bold", border: 'none', cursor: 'pointer', color: 'white' }}
              >
                {t("Buy")}
              </button>
            </div>
`.trim().split('\n');

lines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', lines.join('\n'));
console.log('Fixed buttons exactly.');
