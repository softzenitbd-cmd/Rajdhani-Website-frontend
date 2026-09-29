const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Pass filters to getProducts() so it searches for the product even if the stock API fails
code = code.replace(
    /productService\.getProducts\(\)\.catch\(\(\) => null\)/,
    'productService.getProducts({ search: filters.searchAll, barcode: filters.barcode, page_size: 500 }).catch(() => null)'
);

// 2. Merge missing products from pList into list
const mergeCode = `
        const pList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.results || prodsRes?.data || []);
        
        // --- ADDED FALLBACK FOR MISSING PURCHASED PRODUCTS ---
        const existingProductIds = new Set(list.map(item => String(item.product_id || item.id || '')));
        pList.forEach(prod => {
            const pid = String(prod.id);
            if (pid && !existingProductIds.has(pid)) {
                existingProductIds.add(pid);
                list.push({
                    id: prod.id,
                    product_id: prod.id,
                    name: prod.name,
                    barcode: prod.barcode || prod.code || '',
                    group_name: prod.group_name || prod.category || '',
                    group_id: prod.group || prod.group_id || '',
                    buying_price: prod.purchase_price || prod.buying_price || 0,
                    selling_price: prod.sales_price || prod.selling_price || 0,
                    opening_stock: prod.opening_stock || 0,
                    current_stock: prod.stock || prod.current_stock || 0,
                    buy_qty: 0, // Unknown from generic product endpoint
                    sale_qty: 0,
                    total_buying_value: 0,
                    total_selling_value: 0,
                    date: prod.created_at || new Date().toISOString()
                });
            }
        });
        // ---------------------------------------------------
        
        setLoading(false);
`;

code = code.replace(
    /const pList = Array\.isArray\(prodsRes\)[^;]+;\s*setLoading\(false\);/,
    mergeCode
);

fs.writeFileSync(filePath, code);
console.log('Added fallback to merge missing products into stock list');
