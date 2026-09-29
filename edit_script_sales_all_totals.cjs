const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesAll.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Calculate the other totals
const oldTotals = `  const totalSalesAmount = reports.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);`;
const newTotals = `  const totalQty = reports.reduce((sum, item) => sum + Number(item.product_qty ?? item.qty ?? 0), 0);
  const totalSalesAmount = reports.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);
  const totalReceive = reports.reduce((sum, item) => sum + Number(item.invoice?.receive_amount || item.receive || 0), 0);
  const totalProfit = reports.reduce((sum, item) => sum + Number(item.profit || 0), 0);`;

code = code.replace(oldTotals, newTotals);

// 2. Add tfoot at the bottom of the table
const tbodyEnd = `              </tbody>
            </table>`;
const tbodyWithFoot = `              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="5" style={{ padding: '10px 4px', textAlign: 'right' }}>{t("Total:")}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>{totalQty}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalSalesAmount.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#059669' }}>৳ {totalReceive.toFixed(2)}</td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#2563eb' }}>৳ {totalProfit.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>`;

code = code.replace(tbodyEnd, tbodyWithFoot);

fs.writeFileSync(filePath, code);
console.log("Added tfoot with totals in SalesAll.jsx");
