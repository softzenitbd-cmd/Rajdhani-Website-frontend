const fs = require('fs');

// 1. Update FormSettingsModal.jsx
const modalFile = 'src/components/FormSettingsModal.jsx';
let modalCode = fs.readFileSync(modalFile, 'utf8');

if (!modalCode.includes('field.hasInput')) {
  modalCode = modalCode.replace(
    /<span style=\{\{ fontSize: 'var\(--fs-14, 14px\)', color: '#334155' \}\}>\{field\.label\}<\/span>/,
    `<span style={{ fontSize: 'var(--fs-14, 14px)', color: '#334155', flex: 1 }}>{field.label}</span>
              
              {field.hasInput && (
                <input 
                  type="number"
                  value={settings[\`\${field.key}_value\`] !== undefined ? settings[\`\${field.key}_value\`] : (field.defaultValue || '')}
                  onChange={(e) => setSettings(prev => ({ ...prev, [\`\${field.key}_value\`]: e.target.value }))}
                  style={{ width: '80px', marginRight: '16px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                  placeholder="%"
                />
              )}`
  );
  fs.writeFileSync(modalFile, modalCode);
  console.log('Updated FormSettingsModal.jsx');
}

// 2. Update PurchaseCreate.jsx
const purchaseFile = 'src/pages/product/PurchaseCreate.jsx';
let purchaseCode = fs.readFileSync(purchaseFile, 'utf8');

// Update FormSettingsModal usage
if (!purchaseCode.includes('percentage_value')) {
  purchaseCode = purchaseCode.replace(
    /\{\s*key:\s*"percentage",\s*label:\s*t\("Percentage"\)\s*\}/,
    `{ key: "percentage", label: t("Percentage"), hasInput: true, defaultValue: salePricePercentage }`
  );
  
  purchaseCode = purchaseCode.replace(
    /initialSettings=\{visibleFields\}/,
    `initialSettings={{...visibleFields, percentage_value: visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage}}`
  );
  
  purchaseCode = purchaseCode.replace(
    /setVisibleFields\(newSettings\);\s*setIsSettingsOpen\(false\);\s*toast\.success\(t\(\"Settings saved successfully!\"\)\);/,
    `setVisibleFields(newSettings);
          setIsSettingsOpen(false);
          toast.success(t("Settings saved successfully!"));
          
          if (newSettings.percentage_value !== undefined) {
            const newPerc = Number(newSettings.percentage_value);
            setItems(prev => prev.map(item => {
               const bp = Number(item.buyingPrice);
               const sp = bp + (bp * newPerc / 100);
               return { ...item, percentage: newPerc, salePrice: Number(sp.toFixed(2)) };
            }));
          }`
  );
  
  // Use visibleFields.percentage_value as default in updateItemField instead of salePricePercentage
  purchaseCode = purchaseCode.replace(
    /const perc = updated\[index\]\.percentage !== undefined && updated\[index\]\.percentage !== '' \? Number\(updated\[index\]\.percentage\) : salePricePercentage;/g,
    `const perc = updated[index].percentage !== undefined && updated[index].percentage !== '' ? Number(updated[index].percentage) : (visibleFields.percentage_value !== undefined ? Number(visibleFields.percentage_value) : salePricePercentage);`
  );

  purchaseCode = purchaseCode.replace(
    /value=\{item\.percentage !== undefined \? item\.percentage : salePricePercentage\}/g,
    `value={item.percentage !== undefined ? item.percentage : (visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage)}`
  );
  
  purchaseCode = purchaseCode.replace(
    /salePrice:\s*Number\(prod\.sales_price\s*\|\|\s*prod\.selling_price\s*\|\|\s*0\),\s*percentage:\s*salePricePercentage,/g,
    `salePrice: Number(prod.sales_price || prod.selling_price || 0),\n          percentage: (visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage),`
  );

  fs.writeFileSync(purchaseFile, purchaseCode);
  console.log('Updated PurchaseCreate.jsx');
}
