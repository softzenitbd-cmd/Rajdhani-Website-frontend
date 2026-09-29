const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', 'utf8');

const updatedFilterLogic = `
  const displayedStocks = stocks.filter(stock => {
    let match = true;
    if (filters.searchAll) {
      const q = filters.searchAll.toLowerCase();
      match = match && (
        (stock.product && String(stock.product).toLowerCase().includes(q)) ||
        (stock.group && String(stock.group).toLowerCase().includes(q))
      );
    }
    if (filters.group) {
      // Find the group name for the selected group ID
      const selectedGroup = groups.find(g => String(g.id) === String(filters.group));
      const groupName = selectedGroup ? selectedGroup.name : filters.group;
      
      match = match && (
        String(stock.groupId) === String(filters.group) || 
        String(stock.group) === String(groupName) ||
        String(stock.group) === String(filters.group)
      );
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

// Replace the previous fallback logic with this one
code = code.replace(
    /const displayedStocks = stocks\.filter\(stock => \{[\s\S]*?return match;\s*\}\);/,
    updatedFilterLogic.trim()
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', code);
console.log('Fixed robust group filtering');
