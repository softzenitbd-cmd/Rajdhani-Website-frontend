const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/services/saleService.js';
let code = fs.readFileSync(filePath, 'utf8');

const oldLine = `const allItems = toList(await apiClient.get(ENDPOINTS.SALE_ITEMS).catch(() => []));`;
const newLine = `const allItems = toList(await apiClient.get(ENDPOINTS.SALE_ITEMS, { params: { limit: 10000, from_date: filters.from_date, to_date: filters.to_date } }).catch(() => []));`;

if (code.includes(oldLine)) {
    code = code.replace(oldLine, newLine);
    fs.writeFileSync(filePath, code);
    console.log("Updated limit in saleService.js");
} else {
    console.log("Could not find the line in saleService.js");
}
