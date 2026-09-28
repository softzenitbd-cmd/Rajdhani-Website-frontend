import fs from 'fs';

// Update PurchaseList.jsx
let listContent = fs.readFileSync('src/pages/product/PurchaseList.jsx', 'utf8');
listContent = listContent.replace(
  /useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[filters\]\);/g,
  `useEffect(() => {\n    fetchData();\n  }, []); // Fetch only on mount, frontend filter handles the rest`
);
fs.writeFileSync('src/pages/product/PurchaseList.jsx', listContent);

// Update PurchaseInvoiceList.jsx
let invoiceContent = fs.readFileSync('src/pages/product/PurchaseInvoiceList.jsx', 'utf8');
invoiceContent = invoiceContent.replace(
  /useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[filters\]\);/g,
  `useEffect(() => {\n    fetchData();\n  }, []); // Fetch only on mount, frontend filter handles the rest`
);
fs.writeFileSync('src/pages/product/PurchaseInvoiceList.jsx', invoiceContent);

console.log('Fixed useEffect dependency');
