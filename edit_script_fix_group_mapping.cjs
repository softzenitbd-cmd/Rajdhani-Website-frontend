const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', 'utf8');

// Fix the missing groupId property
code = code.replace(
    /group: item\.group_name \|\| matchedProd\?\.group_name \|\| '',/,
    'group: item.group_name || matchedProd?.group_name || \'\',\n          groupId: item.group_id || matchedProd?.group_id || item.group || matchedProd?.group || \'\','
);

// To ensure group filtering by ID works correctly across all possible stock group data structures
code = code.replace(
    /String\(stock\.groupId\) === String\(filters\.group\) \|\| String\(stock\.group\) === String\(filters\.group\)/,
    'String(stock.groupId) === String(filters.group) || String(stock.group) === String(filters.group)'
);

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx', code);
console.log('Fixed group mapping');
