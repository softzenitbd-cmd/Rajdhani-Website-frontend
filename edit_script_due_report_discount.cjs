const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add discount mapping in normalized
const normalizedOld = `const collection = num(r, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');`;
const normalizedNew = `const discount = num(r, 'discount', 'discount_amount', 'total_discount');
    const collection = num(r, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');`;
code = code.replace(normalizedOld, normalizedNew);

const returnOld = `salesReturn,
      collection,
      moneyReturn,
      due: finalDue,`;
const returnNew = `salesReturn,
      discount,
      collection,
      moneyReturn,
      due: finalDue,`;
code = code.replace(returnOld, returnNew);

// 2. Update Excel Data
const excelOld = `'Total Bill': r.totalBill, Collection: r.collection, Due: r.due`;
const excelNew = `'Total Bill': r.totalBill, Discount: r.discount, Collection: r.collection, Due: r.due`;
code = code.replace(excelOld, excelNew);
code = code.replace(excelOld, excelNew); // twice for grouped and not grouped

// 3. Update Table Header
const headerOld = `<th style={th}>{t("TOTAL BILL")}</th>
                  <th style={th}>{t("COLLECTION")}</th>`;
const headerNew = `<th style={th}>{t("TOTAL BILL")}</th>
                  <th style={th}>{t("DISCOUNT")}</th>
                  <th style={th}>{t("COLLECTION")}</th>`;
code = code.replace(headerOld, headerNew);

// 4. Update Table Row
const rowOld = `<td style={td}>{money(r.totalBill)}</td>
                      <td style={{ ...td, color: '#059669' }}>{money(r.collection)}</td>`;
const rowNew = `<td style={td}>{money(r.totalBill)}</td>
                      <td style={td}>{money(r.discount)}</td>
                      <td style={{ ...td, color: '#059669' }}>{money(r.collection)}</td>`;
code = code.replace(rowOld, rowNew);

// 5. Update Table Footer
const footerOld = `['prevDue', 'sales', 'salesReturn', 'totalBill', 'collection', 'due']`;
const footerNew = `['prevDue', 'sales', 'salesReturn', 'totalBill', 'discount', 'collection', 'due']`;
code = code.replace(footerOld, footerNew);

fs.writeFileSync(filePath, code);
console.log("Added Discount column to ClientDueReport");
