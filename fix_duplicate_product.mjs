import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const oldLogic = `      setItems(prevItems => {
        const existingIndex = prevItems.findIndex(i => String(i.id) === String(prod.id));
        if (existingIndex > -1) {
          const updated = [...prevItems];
          updated[existingIndex].quantity += 1;
          return updated;
        } else {
          return [...prevItems, {
            id: prod.id,
            name: prod.name || prod.title || 'Product',
            quantity: Number(prod.stock || prod.opening_stock || 1),
            buyingPrice: Number(prod.purchase_price || prod.buying_price || prod.price || 0),
            salePrice: Number(prod.sales_price || prod.selling_price || 0),
            barcode: prod.code || prod.barcode || "-"
          }];
        }
      });`;

const newLogic = `      setItems(prevItems => {
        return [...prevItems, {
          id: prod.id,
          name: prod.name || prod.title || 'Product',
          quantity: Number(prod.stock || prod.opening_stock || 1),
          buyingPrice: Number(prod.purchase_price || prod.buying_price || prod.price || 0),
          salePrice: Number(prod.sales_price || prod.selling_price || 0),
          barcode: prod.code || prod.barcode || "-"
        }];
      });`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
console.log('Fixed handleSelectProduct to not merge identical products');
