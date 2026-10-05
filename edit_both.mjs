
import fs from 'fs';

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix React import if needed
  if (!content.includes('useEffect')) {
    content = content.replace('import React, { useState }', 'import React, { useState, useEffect }');
  }

  // Use state for companyInfo to make it reactive
  if (content.includes('const companyInfo = companyStore.getCached();')) {
    content = content.replace(
      'const companyInfo = companyStore.getCached();',
      'const [companyInfo, setCompanyInfo] = React.useState(companyStore.getCached());\n  React.useEffect(() => {\n    const h = () => setCompanyInfo(companyStore.getCached());\n    window.addEventListener(companyStore.EVENT, h);\n    companyStore.load();\n    return () => window.removeEventListener(companyStore.EVENT, h);\n  }, []);'
    );
  }

  // Update robust boolean check
  content = content.replace(
    'const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === \"true\";',
    'const isAuto = companyInfo.sale_price_auto_generate;\n  const autoCalculateSalePrice = isAuto === true || isAuto === \"true\" || isAuto === \"True\" || isAuto === 1 || isAuto === \"1\";'
  );
  content = content.replace(
    'const autoCalculateSalePrice = companyInfo.sale_price_auto_generate === true || companyInfo.sale_price_auto_generate === \'true\';',
    'const isAuto = companyInfo.sale_price_auto_generate;\n  const autoCalculateSalePrice = isAuto === true || isAuto === \"true\" || isAuto === \"True\" || isAuto === 1 || isAuto === \"1\";'
  );

  // Update logic condition for percentage
  content = content.replace(/salePricePercentage > 0/g, 'salePricePercentage >= 0');

  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
}

patchFile('src/pages/product/ProductCreate.jsx');
patchFile('src/pages/product/PurchaseCreate.jsx');

