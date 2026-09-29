const fs = require('fs');

const fileDaily = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesDaily.jsx';
let codeDaily = fs.readFileSync(fileDaily, 'utf8');

const regexDaily = /<div style={{ fontSize: 'var\(--fs-9, 9px\)', color: '#64748b' }}>\{row\.client_phone.*\}<\/div>/;
const newPhoneLogic = `<div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || row.client?.phone || row.client?.mobile || row.invoice?.client?.phone || (clients.find(c => String(c.id || c.uuid) === String(row.client_id))?.phone) || (clients.find(c => (c.name || c.company_name) === (row.client_name || row.client))?.phone) || '-'}</div>`;

if (codeDaily.match(regexDaily)) {
    codeDaily = codeDaily.replace(regexDaily, newPhoneLogic);
    fs.writeFileSync(fileDaily, codeDaily);
    console.log("Updated client phone lookup in SalesDaily.jsx");
} else {
    console.log("Could not find regex in SalesDaily");
}

const fileAll = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesAll.jsx';
let codeAll = fs.readFileSync(fileAll, 'utf8');

if (codeAll.match(regexDaily)) {
    codeAll = codeAll.replace(regexDaily, newPhoneLogic);
    fs.writeFileSync(fileAll, codeAll);
    console.log("Updated client phone lookup in SalesAll.jsx");
} else {
    console.log("Could not find regex in SalesAll");
}
