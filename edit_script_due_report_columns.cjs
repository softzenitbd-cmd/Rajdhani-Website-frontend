const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update excelData
const excelGroupedOld = `'Previous Due': r.prevDue, Sales: r.sales, 'Total Bill': r.totalBill, 'Sales Return': r.salesReturn, Collection: r.collection, Return: r.moneyReturn, Due: r.due`;
const excelGroupedNew = `'Previous Due': r.prevDue, Sales: r.sales, 'Sales Return': r.salesReturn, 'Total Bill': r.totalBill, Collection: r.collection, Due: r.due`;

code = code.replace(excelGroupedOld, excelGroupedNew);
code = code.replace(excelGroupedOld, excelGroupedNew); // replace second occurrence

// 2. Update table headers
const oldHeaders = `<th style={th}>{t("PREVIOUS DUE")}</th>
                  <th style={th}>{t("SALES")}</th>
                  <th style={th}>{t("TOTAL BILL")}</th>
                  <th style={th}>{t("SALES RETURN")}</th>
                  <th style={th}>{t("COLLECTION")}</th>
                  <th style={th}>{t("RETURN")}</th>
                  <th style={th}>{t("DUE")}</th>`;

const newHeaders = `<th style={th}>{t("PREVIOUS DUE")}</th>
                  <th style={th}>{t("SALES")}</th>
                  <th style={th}>{t("SALES RETURN")}</th>
                  <th style={th}>{t("TOTAL BILL")}</th>
                  <th style={th}>{t("COLLECTION")}</th>
                  <th style={th}>{t("DUE")}</th>`;

code = code.replace(oldHeaders, newHeaders);

// 3. Update table rows
const oldRows = `<td style={td}>{money(r.prevDue)}</td>
                      <td style={td}>{money(r.sales)}</td>
                      <td style={td}>{money(r.totalBill)}</td>
                      <td style={td}>{money(r.salesReturn)}</td>
                      <td style={{ ...td, color: '#059669' }}>{money(r.collection)}</td>
                      <td style={td}>{money(r.moneyReturn)}</td>
                      <td style={{ ...td, fontWeight: 'bold', color: r.due > 0 ? '#dc2626' : '#059669' }}>{money(r.due)}</td>`;

const newRows = `<td style={td}>{money(r.prevDue)}</td>
                      <td style={td}>{money(r.sales)}</td>
                      <td style={td}>{money(r.salesReturn)}</td>
                      <td style={td}>{money(r.totalBill)}</td>
                      <td style={{ ...td, color: '#059669' }}>{money(r.collection)}</td>
                      <td style={{ ...td, fontWeight: 'bold', color: r.due > 0 ? '#dc2626' : '#059669' }}>{money(r.due)}</td>`;

code = code.replace(oldRows, newRows);

// 4. Update table footer
const oldFooter = `['prevDue', 'sales', 'totalBill', 'salesReturn', 'collection', 'moneyReturn', 'due'].map((k) => (`;
const newFooter = `['prevDue', 'sales', 'salesReturn', 'totalBill', 'collection', 'due'].map((k) => (`;

code = code.replace(oldFooter, newFooter);

fs.writeFileSync(filePath, code);
console.log("Updated ClientDueReport columns: removed moneyReturn, placed salesReturn next to sales");
