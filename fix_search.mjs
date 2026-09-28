import fs from 'fs';

// Update PurchaseList.jsx
let listContent = fs.readFileSync('src/pages/product/PurchaseList.jsx', 'utf8');

const oldListFilter = `  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!String(p.invoice).toLowerCase().includes(q) && !String(p.supplier).toLowerCase().includes(q)) return false;
    }
    return true;
  });`;

const newListFilter = `  const filteredPurchases = purchases.filter(p => {
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
      if (new Date(p.date || p.created_at) < new Date(filters.from_date)) return false;
    }
    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(p.date || p.created_at) > toDate) return false;
    }
    return true;
  });`;

listContent = listContent.replace(oldListFilter, newListFilter);
fs.writeFileSync('src/pages/product/PurchaseList.jsx', listContent);


// Update PurchaseInvoiceList.jsx
let invoiceListContent = fs.readFileSync('src/pages/product/PurchaseInvoiceList.jsx', 'utf8');

const oldInvoiceFilter = `  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.productName && !String(p.product).toLowerCase().includes(filters.productName.toLowerCase())) return false;
    return true;
  });`;

const newInvoiceFilter = `  const filteredPurchases = purchases.filter(p => {
    if (filters.supplier && String(p.supplier).toLowerCase() !== String(filters.supplier).toLowerCase()) return false;
    if (filters.productName && !String(p.product).toLowerCase().includes(filters.productName.toLowerCase())) return false;
    if (filters.barcode && !String(p.product || '').toLowerCase().includes(filters.barcode.toLowerCase())) return false;
    if (filters.from_date) {
      if (new Date(p.date || p.created_at) < new Date(filters.from_date)) return false;
    }
    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(p.date || p.created_at) > toDate) return false;
    }
    return true;
  });`;

invoiceListContent = invoiceListContent.replace(oldInvoiceFilter, newInvoiceFilter);
fs.writeFileSync('src/pages/product/PurchaseInvoiceList.jsx', invoiceListContent);

console.log('Fixed search filtering for both lists');
