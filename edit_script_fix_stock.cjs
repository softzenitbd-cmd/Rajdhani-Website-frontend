const fs = require('fs');

// 1. Update productService.js to include product_id
let svcCode = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/services/productService.js', 'utf8');
if (!svcCode.includes('params.product_id = filters.product_id')) {
    svcCode = svcCode.replace(
        /if \(filters\.group_id\) params\.group_id = filters\.group_id;/,
        'if (filters.group_id) params.group_id = filters.group_id;\n      if (filters.product_id) params.product_id = filters.product_id;'
    );
    fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/services/productService.js', svcCode);
}

// 2. Update ProductStockList.jsx
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', 'utf8');

// Update fetchStockData payload
code = code.replace(
    /group_id: filters\.group,/,
    'group_id: filters.group, \n            product_id: filters.productId,'
);

// Fix date formatting
const formatFunc = `
const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        const parts = String(dateStr).split('T')[0].split('-');
        if (parts.length === 3) return \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
        return String(dateStr).split('T')[0];
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return \`\${day}-\${month}-\${year}\`;
};
`;
if (!code.includes('formatToDDMMYYYY')) {
    code = code.replace(/const displayedStocks = stocks;/, formatFunc + '\n  const displayedStocks = stocks;');
}

// Ensure the render uses formatToDDMMYYYY instead of fmtDate
code = code.replace(/fmtDate\(stock\.date\)/g, 'formatToDDMMYYYY(stock.date)');

// Fix option value for group dropdown (from name to ID)
code = code.replace(
    /<option key=\{g\.id\} value=\{g\.name \|\| g\.id\}>\{g\.name\}<\/option>/g,
    '<option key={g.id} value={g.id}>{g.name}</option>'
);

// Add robust frontend filtering as a fallback
const filterLogic = `
  const displayedStocks = stocks.filter(stock => {
    let match = true;
    if (filters.searchAll) {
      const q = filters.searchAll.toLowerCase();
      match = match && (
        (stock.product && stock.product.toLowerCase().includes(q)) ||
        (stock.group && stock.group.toLowerCase().includes(q))
      );
    }
    if (filters.group) {
      match = match && (String(stock.groupId) === String(filters.group) || String(stock.group) === String(filters.group));
    }
    if (filters.productId) {
      match = match && String(stock.productId) === String(filters.productId);
    }
    if (filters.barcode) {
      match = match && (stock.barcode && String(stock.barcode).includes(filters.barcode));
    }
    if (filters.fromDate) {
       const fd = new Date(filters.fromDate);
       const sd = new Date(stock.date);
       if (!isNaN(fd) && !isNaN(sd)) match = match && sd >= fd;
    }
    if (filters.toDate) {
       const td = new Date(filters.toDate);
       td.setDate(td.getDate() + 1);
       const sd = new Date(stock.date);
       if (!isNaN(td) && !isNaN(sd)) match = match && sd < td;
    }
    return match;
  });
`;

code = code.replace(/const displayedStocks = stocks;/, filterLogic);

// Add groupId mapping when setting stocks
code = code.replace(
    /group: item\.group_name \|\| matchedGroup\?\.name \|\| '',/,
    'group: item.group_name || matchedGroup?.name || \'\',\n          groupId: item.group_id || matchedProd?.group_id || \'\',\n          barcode: item.barcode || matchedProd?.code || \'\','
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', code);
console.log('Fixed search and date format');
