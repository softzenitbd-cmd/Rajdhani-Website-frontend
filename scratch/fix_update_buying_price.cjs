const fs = require('fs');
const file = 'src/pages/product/PurchaseCreate.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(field\s*===\s*"buyingPrice"\s*&&\s*isAutoGenerateEnabled\s*&&\s*value\s*!==\s*""\)\s*\{\s*const\s*bp\s*=\s*Number\(value\);\s*if\s*\(!isNaN\(bp\)\s*&&\s*bp\s*>=\s*0\)\s*\{\s*const\s*perc\s*=\s*updated\[index\]\.percentage\s*!==\s*undefined\s*&&\s*updated\[index\]\.percentage\s*!==\s*''\s*\?\s*Number\(updated\[index\]\.percentage\)\s*:\s*\(visibleFields\.percentage_value\s*!==\s*undefined\s*\?\s*Number\(visibleFields\.percentage_value\)\s*:\s*salePricePercentage\);\s*const\s*sp\s*=\s*bp\s*\+\s*\(bp\s*\*\s*perc\s*\/\s*100\);\s*updated\[index\]\.salePrice\s*=\s*Number\(sp\.toFixed\(2\)\);\s*\}\s*\}/;

const replacement = `if (field === "buyingPrice" && value !== "") {
        const bp = Number(value);
        if (!isNaN(bp) && bp >= 0) {
          const perc = updated[index].percentage !== undefined && updated[index].percentage !== '' ? Number(updated[index].percentage) : (visibleFields.percentage_value !== undefined ? Number(visibleFields.percentage_value) : salePricePercentage);
          if (isAutoGenerateEnabled || perc > 0) {
            const sp = bp + (bp * perc / 100);
            updated[index].salePrice = Number(sp.toFixed(2));
          }
        }
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
  console.log('Fixed updateItemField for buyingPrice in PurchaseCreate.jsx');
} else {
  console.log('Could not find regex match');
}
