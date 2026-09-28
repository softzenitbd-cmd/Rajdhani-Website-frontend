import fs from 'fs';

// Update PurchaseList.jsx
let listContent = fs.readFileSync('src/pages/product/PurchaseList.jsx', 'utf8');

const regexList = /const filteredPurchases = purchases\.filter\(p => \{[\s\S]*?return true;\s*\}\);/;

const newListFilter = `const parseDateSafe = (dStr) => {
    if (!dStr) return new Date(0);
    if (String(dStr).includes('-')) {
      const parts = String(dStr).split('-');
      if (parts.length === 3 && parts[0].length <= 2) {
        return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}T00:00:00\`);
      }
    }
    return new Date(dStr);
  };

  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!String(p.invoice).toLowerCase().includes(q) && !String(p.supplier).toLowerCase().includes(q)) return false;
    }
    if (filters.barcode) {
      if (!String(p.barcode || '').toLowerCase().includes(filters.barcode.toLowerCase()) && 
          !String(p.product || '').toLowerCase().includes(filters.barcode.toLowerCase())) return false;
    }
    if (filters.from_date) {
      const pDate = parseDateSafe(p.date || p.created_at);
      if (pDate < new Date(filters.from_date)) return false;
    }
    if (filters.to_date) {
      const pDate = parseDateSafe(p.date || p.created_at);
      const toDate = new Date(filters.to_date);
      toDate.setHours(23, 59, 59, 999);
      if (pDate > toDate) return false;
    }
    return true;
  });`;

listContent = listContent.replace(regexList, newListFilter);
fs.writeFileSync('src/pages/product/PurchaseList.jsx', listContent);


// Update PurchaseInvoiceList.jsx
let invoiceListContent = fs.readFileSync('src/pages/product/PurchaseInvoiceList.jsx', 'utf8');

const regexInvoice = /const filteredPurchases = purchases\.filter\(p => \{[\s\S]*?return true;\s*\}\);/;

const newInvoiceFilter = `const parseDateSafe = (dStr) => {
    if (!dStr) return new Date(0);
    if (String(dStr).includes('-')) {
      const parts = String(dStr).split('-');
      if (parts.length === 3 && parts[0].length <= 2) {
        return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}T00:00:00\`);
      }
    }
    return new Date(dStr);
  };

  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.productName && !String(p.product).toLowerCase().includes(filters.productName.toLowerCase())) return false;
    if (filters.barcode && !String(p.product || '').toLowerCase().includes(filters.barcode.toLowerCase())) return false;
    if (filters.from_date) {
      const pDate = parseDateSafe(p.date || p.created_at);
      if (pDate < new Date(filters.from_date)) return false;
    }
    if (filters.to_date) {
      const pDate = parseDateSafe(p.date || p.created_at);
      const toDate = new Date(filters.to_date);
      toDate.setHours(23, 59, 59, 999);
      if (pDate > toDate) return false;
    }
    return true;
  });`;

invoiceListContent = invoiceListContent.replace(regexInvoice, newInvoiceFilter);
fs.writeFileSync('src/pages/product/PurchaseInvoiceList.jsx', invoiceListContent);

console.log('Fixed search filtering for both lists with regex and date parsing');
