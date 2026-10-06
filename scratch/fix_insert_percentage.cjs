const fs = require('fs');

const file = 'src/pages/product/PurchaseCreate.jsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `          buyingPrice: Number(
            prod.purchase_price || prod.buying_price || prod.price || 0,
          ),
          salePrice: Number(prod.sales_price || prod.selling_price || 0),
          percentage: (visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage),`;

const replacementStr = `          buyingPrice: Number(
            prod.purchase_price || prod.buying_price || prod.price || 0,
          ),
          salePrice: (() => {
            const bp = Number(prod.purchase_price || prod.buying_price || prod.price || 0);
            const perc = visibleFields.percentage_value !== undefined && visibleFields.percentage_value !== '' ? Number(visibleFields.percentage_value) : salePricePercentage;
            if (isAutoGenerateEnabled || perc > 0) {
              return Number((bp + (bp * perc / 100)).toFixed(2));
            }
            return Number(prod.sales_price || prod.selling_price || 0);
          })(),
          percentage: (visibleFields.percentage_value !== undefined && visibleFields.percentage_value !== '' ? Number(visibleFields.percentage_value) : salePricePercentage),`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(file, code);
  console.log('Fixed handleSelectProduct in PurchaseCreate.jsx');
} else {
  console.log('Could not find the target string in handleSelectProduct');
}
