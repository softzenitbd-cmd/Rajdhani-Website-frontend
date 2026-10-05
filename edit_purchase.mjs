
import fs from 'fs';
const file = 'src/pages/product/PurchaseCreate.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { useToast } from \"../../context/ToastContext\";',
  'import { companyStore } from \"../../services/companyStore\";\nimport { useToast } from \"../../context/ToastContext\";'
);

content = content.replace(
  'const isEditMode = Boolean(id);',
  'const isEditMode = Boolean(id);\n\n  const companyInfo = companyStore.getCached();\n  const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === \"true\";\n  const salePricePercentage = Number(companyInfo.sale_price_percentage) || 0;'
);

content = content.replace(
  'updated[index][field] = Math.max(0, Number(value));\r\n      return updated;',
  'updated[index][field] = Math.max(0, Number(value));\n      if (field === \"buyingPrice\" && autoCalculateSalePrice && salePricePercentage > 0 && value !== \"\") {\n        const bp = Number(value);\n        if (!isNaN(bp) && bp >= 0) {\n          const sp = bp + (bp * salePricePercentage / 100);\n          updated[index].salePrice = Number(sp.toFixed(2));\n        }\n      }\n      return updated;'
);

content = content.replace(
  'updated[index][field] = Math.max(0, Number(value));\n      return updated;',
  'updated[index][field] = Math.max(0, Number(value));\n      if (field === \"buyingPrice\" && autoCalculateSalePrice && salePricePercentage > 0 && value !== \"\") {\n        const bp = Number(value);\n        if (!isNaN(bp) && bp >= 0) {\n          const sp = bp + (bp * salePricePercentage / 100);\n          updated[index].salePrice = Number(sp.toFixed(2));\n        }\n      }\n      return updated;'
);

fs.writeFileSync(file, content);

