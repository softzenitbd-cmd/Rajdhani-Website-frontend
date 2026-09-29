const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const regex = /let\s+v\s*=\s*row\.invoice\?\.invoice_id\s*\|\|\s*row\.invoice\?\.id\s*\|\|\s*row\.invoice_no\s*\|\|\s*row\.voucher\s*\|\|\s*row\.invoice_id;\s*if\s*\(typeof\s+v\s*===\s*'string'\s*&&\s*v\.length\s*>\s*20\s*&&\s*v\.includes\('-'\)\)\s*\{\s*v\s*=\s*row\.invoice\?\.voucher_no\s*\|\|\s*row\.voucher_no\s*\|\|\s*'-';\s*\}/g;

const newBlock = `let v = row.invoice?.invoice_no || row.invoice_no || row.voucher_no || row.invoice?.voucher_no || row.invoice?.invoice_id || row.voucher || row.invoice_id || row.invoice?.id || row.id;
        if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
           v = row.invoice?.voucher_no || row.voucher_no || v.split('-')[0];
        }`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (code.match(regex)) {
        code = code.replace(regex, newBlock);
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, code);
        console.log("Updated voucher logic in", file);
    }
});
