const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '16px' \}\}>[\s\S]*?\{Number\(c\.due\) > 0 \? \([\s\S]*?<\/div>\s*\)\s*:\s*\([\s\S]*?<\/div>\s*\)\}\s*<div style=\{\{ width: '100px', textAlign: 'right' \}\}>[\s\S]*?<\/div>\s*<\/div>/;

const newRender = `<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '90px', textAlign: 'right' }}>
                        <span style={{ color: c.phone ? '#475569' : '#ef4444', fontWeight: '500', fontSize: '12px' }}>
                          {c.phone || t("N/A")}
                        </span>
                      </div>

                      {Number(c.due) > 0 ? (
                        <div style={{ minWidth: '70px', textAlign: 'right', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: '10px', color: '#ef4444', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>{t("Due")}</span>
                          <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>{Number(c.due).toFixed(2)}</span>
                        </div>
                      ) : (
                        <div style={{ minWidth: '70px' }}></div>
                      )}
                    </div>`;

if (code.match(regex)) {
    code = code.replace(regex, newRender);
    fs.writeFileSync(filePath, code);
    console.log("Swapped Phone and Due!");
} else {
    console.log("Regex not found");
}
