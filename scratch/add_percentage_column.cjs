const fs = require('fs');
const file = 'src/pages/product/PurchaseCreate.jsx';
let code = fs.readFileSync(file, 'utf8');

let changed = false;

// 1. Add percentage to visibleFields
if (!code.includes('percentage: true')) {
  code = code.replace(/receive_amount:\s*true,?\s*\n\s*\}/, 'receive_amount: true,\n    percentage: true,\n  }');
  changed = true;
}

// 2. Add percentage to items in handleSelectProduct
if (!code.includes('percentage: salePricePercentage')) {
  code = code.replace(/salePrice:\s*Number\(prod\.sales_price\s*\|\|\s*prod\.selling_price\s*\|\|\s*0\),/, 'salePrice: Number(prod.sales_price || prod.selling_price || 0),\n          percentage: salePricePercentage,');
  changed = true;
}

// 3. Update updateItemField for buyingPrice and percentage
const newUpdateItemField = `
  const updateItemField = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = field === 'percentage' ? value : Math.max(0, Number(value));
      
      if (field === "buyingPrice" && isAutoGenerateEnabled && value !== "") {
        const bp = Number(value);
        if (!isNaN(bp) && bp >= 0) {
          const perc = updated[index].percentage !== undefined && updated[index].percentage !== '' ? Number(updated[index].percentage) : salePricePercentage;
          const sp = bp + (bp * perc / 100);
          updated[index].salePrice = Number(sp.toFixed(2));
        }
      }
      
      if (field === "percentage") {
        const perc = Number(value);
        const bp = Number(updated[index].buyingPrice);
        if (!isNaN(bp) && !isNaN(perc) && bp >= 0) {
           const sp = bp + (bp * perc / 100);
           updated[index].salePrice = Number(sp.toFixed(2));
        }
      }
      
      return updated;
    });
  };
`;
if (!code.includes('field === "percentage"')) {
  code = code.replace(/const updateItemField = \(index, field, value\) => \{[\s\S]*?return updated;\s*\n\s*\}\);\s*\n\s*\};/, newUpdateItemField);
  changed = true;
}

// 4. Add percentage th to table
if (!code.includes('PERCENTAGE (%)')) {
  code = code.replace(/<th[^>]*>\s*\{t\(\"TOTAL BUYING PRICE\"\)\}\s*<\/th>/, `<th
                      style={{
                        textAlign: "right",
                        borderRight: "1px solid white",
                        padding: "6px", fontSize: "11px",
                        fontSize: "var(--fs-11, 11px)",
                      }}
                    >
                      {t("TOTAL BUYING PRICE")}
                    </th>
                    {visibleFields.percentage !== false && (
                      <th
                        style={{
                          textAlign: "center",
                          borderRight: "1px solid white",
                          padding: "6px", fontSize: "11px",
                          fontSize: "var(--fs-11, 11px)",
                          width: "90px",
                        }}
                      >
                        {t("PERCENTAGE (%)")}
                      </th>
                    )}`);
  changed = true;
}

// 5. Add percentage td to table
if (!code.includes('updateItemField(idx, "percentage"')) {
  code = code.replace(/<td[^>]*>\s*৳\s*\{Number\(item\.quantity\s*\*\s*item\.buyingPrice\)\.toFixed\(2\)\}\s*<\/td>/, `<td style={{ textAlign: "right", padding: "4px", fontSize: "12px", fontWeight: "bold" }}>
                          ৳ {Number(item.quantity * item.buyingPrice).toFixed(2)}
                        </td>
                        {visibleFields.percentage !== false && (
                          <td style={{ textAlign: "center", padding: "4px", fontSize: "12px" }}>
                            <input
                              type="number"
                              value={item.percentage !== undefined ? item.percentage : salePricePercentage}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateItemField(idx, "percentage", e.target.value)
                              }
                              style={{ ...ashInput, width: "80px", textAlign: "center" }}
                            />
                          </td>
                        )}`);
  changed = true;
}

// 6. Update tfoot colSpan
if (!code.includes('visibleFields.percentage !== false && <td style={{ borderRight')) {
  code = code.replace(/<td\s*style=\{\{\s*borderRight:\s*\"1px solid #e2e8f0\",\s*borderTop:\s*\"1px solid #e2e8f0\",\s*\}\}\s*><\/td>\s*<td\s*style=\{\{\s*textAlign:\s*\"right\"/, `{visibleFields.percentage !== false && <td style={{ borderRight: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}></td>}
                    <td style={{ borderRight: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}></td>
                    <td
                      style={{ textAlign: "right"`);
  changed = true;
}

// 7. Add field to FormSettingsModal
if (!code.includes('key: "percentage"')) {
  code = code.replace(/\{\s*key:\s*\"receive_amount\",\s*label:\s*t\(\"Receive Amount\"\)\s*\}/, `{ key: "receive_amount", label: t("Receive Amount") },
          { key: "percentage", label: t("Percentage") }`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(file, code);
  console.log('Modified PurchaseCreate.jsx successfully!');
} else {
  console.log('No changes made, script might have failed to match regex.');
}
