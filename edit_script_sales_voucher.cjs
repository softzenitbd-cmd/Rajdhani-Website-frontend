const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const oldBlock1 = `        let v = row.invoice?.invoice_id || row.invoice?.id || row.invoice_no || row.voucher || row.invoice_id;
        if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
           v = row.invoice?.voucher_no || row.voucher_no || '-';
        }`;

const oldBlock2 = `        let v = row.invoice?.invoice_id || row.invoice?.id || row.invoice_no || row.voucher || row.invoice_id;
        if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
          v = row.invoice?.voucher_no || row.voucher_no || '-';
        }`;

const newBlock = `        let v = row.invoice?.invoice_no || row.invoice_no || row.voucher_no || row.invoice?.voucher_no || row.invoice?.invoice_id || row.voucher || row.invoice_id || row.invoice?.id || row.id;
        if (typeof v === 'string' && v.length > 20 && v.includes('-')) {
           v = row.invoice?.voucher_no || row.voucher_no || v.split('-')[0];
        }`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (code.includes(oldBlock1)) {
        code = code.replace(new RegExp(oldBlock1.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), newBlock);
        changed = true;
    }
    if (code.includes(oldBlock2)) {
        code = code.replace(new RegExp(oldBlock2.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), newBlock);
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, code);
        console.log("Updated voucher logic in", file);
    }
});
