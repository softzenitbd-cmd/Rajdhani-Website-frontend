const fs = require('fs');
const file = 'src/pages/product/PurchaseCreate.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add 'sale_price_auto_generate' to fields array
const fieldsRegex = /\{\s*key:\s*"percentage",\s*label:\s*t\("Percentage"\),\s*hasInput:\s*true,\s*defaultValue:\s*salePricePercentage\s*\}/;
if (code.match(fieldsRegex) && !code.includes('key: "sale_price_auto_generate"')) {
  code = code.replace(
    fieldsRegex,
    `{ key: "percentage", label: t("Percentage"), hasInput: true, defaultValue: salePricePercentage },
          { key: "sale_price_auto_generate", label: t("Auto Generate Sale Price") }`
  );
}

// 2. Add 'sale_price_auto_generate' to initialSettings
const initialSettingsRegex = /initialSettings=\{\{\.\.\.visibleFields,\s*percentage_value:\s*visibleFields\.percentage_value\s*\!==\s*undefined\s*\?\s*visibleFields\.percentage_value\s*:\s*salePricePercentage\}\}/;
if (code.match(initialSettingsRegex)) {
  code = code.replace(
    initialSettingsRegex,
    `initialSettings={{
          ...visibleFields, 
          percentage_value: visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage,
          sale_price_auto_generate: companyInfo?.sale_price_auto_generate === true || companyInfo?.sale_price_auto_generate === "true" || companyInfo?.sale_price_auto_generate === 1
        }}`
  );
}

// 3. Handle saving to Company Info API in onSave
const onSaveRegex = /if\s*\(newSettings\.percentage_value\s*\!==\s*undefined\)\s*\{\s*const\s*newPerc\s*=\s*Number\(newSettings\.percentage_value\);\s*setItems\(prev\s*=>\s*prev\.map\(item\s*=>\s*\{\s*const\s*bp\s*=\s*Number\(item\.buyingPrice\);\s*const\s*sp\s*=\s*bp\s*\+\s*\(bp\s*\*\s*newPerc\s*\/\s*100\);\s*return\s*\{\s*\.\.\.item,\s*percentage:\s*newPerc,\s*salePrice:\s*Number\(sp\.toFixed\(2\)\)\s*\};\s*\}\)\);\s*\}/;

const newOnSaveLogic = `if (newSettings.percentage_value !== undefined) {
            const newPerc = Number(newSettings.percentage_value);
            setItems(prev => prev.map(item => {
               const bp = Number(item.buyingPrice);
               const sp = bp + (bp * newPerc / 100);
               return { ...item, percentage: newPerc, salePrice: Number(sp.toFixed(2)) };
            }));
          }
          
          try {
             // Save company info updates
             const updatedCompanyInfo = {
                ...companyInfo,
                sale_price_auto_generate: newSettings.sale_price_auto_generate ? true : false,
                sale_price_percentage: newSettings.percentage_value !== undefined ? newSettings.percentage_value : salePricePercentage
             };
             await settingService.updateCompanyInfo(updatedCompanyInfo);
             if (typeof setCompanyInfo === 'function') setCompanyInfo(updatedCompanyInfo);
             // Assuming companyStore exists in scope
             try { companyStore.setCached(updatedCompanyInfo); } catch(e){}
          } catch(err) {
             console.error("Failed to update company info", err);
          }
`;

if (code.match(onSaveRegex) && !code.includes('settingService.updateCompanyInfo(updatedCompanyInfo)')) {
  code = code.replace(onSaveRegex, newOnSaveLogic);
}

fs.writeFileSync(file, code);
console.log('Successfully updated PurchaseCreate.jsx to hit company-info API');
