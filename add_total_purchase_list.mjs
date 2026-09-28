import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseList.jsx', 'utf8');

const regex = /<\/tbody>\s*<\/table>/;
const replacement = `            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)' }}>
                <td colSpan="4" style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>{t("Total Amount:")}</td>
                <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1', color: '#16a34a' }}>
                  ৳{filteredPurchases.reduce((acc, curr) => acc + Number(curr.total || 0), 0).toFixed(2)}
                </td>
                <td style={{ borderTop: '1px solid #cbd5e1' }}></td>
              </tr>
            </tfoot>
          </table>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/product/PurchaseList.jsx', content);
console.log('Added total to PurchaseList table');
