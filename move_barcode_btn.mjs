import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const regexBarcodeCol = /<td style=\{\{ textAlign: 'center', padding: '10px', fontSize: 'var\(--fs-11, 11px\)', color: '[^']*', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' \}\} \ntitle=\{item.barcode\}>[\s\S]*?<\/td>/;

const regexActionCol = /<td style=\{\{ textAlign: 'center', padding: '10px' \}\}>[\s\S]*?<div style=\{\{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' \}\}>[\s\S]*?<button\s*type="button"\s*onClick=\{[\s\S]*?\}\s*style=\{[\s\S]*?\}\s*title=\{t\("Generate Barcode"\)\}\s*>[\s\S]*?<Barcode size=\{16\} \/>[\s\S]*?<\/button>([\s\S]*?)<\/div>\s*<\/td>/;

const newBarcodeCol = `                          <td style={{ textAlign: 'center', padding: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b', maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.barcode}>
                                {item.barcode}
                              </div>
                              <button
                                type="button"
                                onClick={() => setBarcodeProductToPrint(item)}
                                style={{ border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={t("Print Barcode")}
                              >
                                <Barcode size={16} />
                              </button>
                            </div>
                          </td>`;

const newActionCol = `                          <td style={{ textAlign: 'center', padding: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>$1</div>
                          </td>`;

content = content.replace(regexBarcodeCol, newBarcodeCol);
content = content.replace(regexActionCol, newActionCol);

fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Moved barcode button to barcode column.');
