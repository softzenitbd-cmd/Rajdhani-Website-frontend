const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/due-report/DueSupplierWise.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update excel data mapping
const excelOld = `Purchase: Number(r.purchase_amount || 0), Payment: Number(r.payment || 0), Return: Number(r.return_amount || 0), Due: Number(r.due || 0),`;
const excelNew = `Purchase: Number(r.purchase_amount || 0), Return: Number(r.return_amount || 0), Payment: Number(r.payment || 0), Due: Number(r.due || 0),`;
code = code.replace(excelOld, excelNew);

// 2. Update table headers
const headerOld = `<th style={{ padding: '10px' }}>{t("PURCHASE")}</th>
                  <th style={{ padding: '10px' }}>{t("PAYMENT")}</th>
                  <th style={{ padding: '10px' }}>{t("RETURN")}</th>`;
const headerNew = `<th style={{ padding: '10px' }}>{t("PURCHASE")}</th>
                  <th style={{ padding: '10px' }}>{t("RETURN")}</th>
                  <th style={{ padding: '10px' }}>{t("PAYMENT")}</th>`;
code = code.replace(headerOld, headerNew);

// 3. Update table rows
const rowOld = `<td style={{ padding: '8px 4px' }}>{money(row.purchase_amount)}</td>
                    <td style={{ padding: '8px 4px', color: '#059669' }}>{money(row.payment)}</td>
                    <td style={{ padding: '8px 4px' }}>{money(row.return_amount)}</td>`;
const rowNew = `<td style={{ padding: '8px 4px' }}>{money(row.purchase_amount)}</td>
                    <td style={{ padding: '8px 4px' }}>{money(row.return_amount)}</td>
                    <td style={{ padding: '8px 4px', color: '#059669' }}>{money(row.payment)}</td>`;
code = code.replace(rowOld, rowNew);

fs.writeFileSync(filePath, code);
console.log("Reordered Supplier Due Report columns");
