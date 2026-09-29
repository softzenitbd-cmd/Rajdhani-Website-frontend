const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const oldRenderRegex = /<div key=\{c\.id\} onClick=\{\(\) => toggle\(c\.id\)\} style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderTop: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 'var\(--fs-13, 13px\)', background: selected\.has\(c\.id\) \? '#f0f9ff' : 'white' \}\}>[\s\S]*?<\/div>/;
const newRender = `<div key={c.id} onClick={() => toggle(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', background: selected.has(c.id) ? '#f0f9ff' : 'white', transition: 'all 0.2s ease', borderLeft: selected.has(c.id) ? '3px solid #0ea5e9' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected.has(c.id) ? <CheckSquare size={18} color="#0ea5e9" /> : <Square size={18} color="#94a3b8" />}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      {c.address && <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {Number(c.due) > 0 ? (
                        <div style={{ textAlign: 'right', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: '10px', color: '#ef4444', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>{t("Due")}</span>
                          <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px' }}>{Number(c.due).toFixed(2)}</span>
                        </div>
                      ) : (
                        <div style={{ width: '60px' }}></div>
                      )}

                      <div style={{ width: '100px', textAlign: 'right' }}>
                        <span style={{ color: c.phone ? '#475569' : '#ef4444', fontWeight: '500', fontSize: '12px' }}>
                          {c.phone || t("N/A")}
                        </span>
                      </div>
                    </div>
                  </div>`;

if (code.match(oldRenderRegex)) {
    code = code.replace(oldRenderRegex, newRender);
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsComposer layout to be smart");
} else {
    console.log("Regex not found in SmsComposer");
}
