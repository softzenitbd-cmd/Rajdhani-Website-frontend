const fs = require('fs');
const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesAll.jsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('<tfoot>')) {
    const tbodyEndIndex = code.lastIndexOf('</tbody>');
    if (tbodyEndIndex !== -1) {
        const footBlock = `              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="5" style={{ padding: '10px 4px', textAlign: 'right' }}>{t("Total:")}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>{totalQty}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalSalesAmount.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalReceive.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#2563eb' }}>৳ {totalProfit.toFixed(2)}</td>
                </tr>
              </tfoot>`;
        
        code = code.slice(0, tbodyEndIndex) + footBlock + code.slice(tbodyEndIndex + 8);
        fs.writeFileSync(filePath, code);
        console.log("Added tfoot to SalesAll.jsx");
    } else {
        console.log("Could not find tbody end");
    }
} else {
    console.log("tfoot already exists");
}
