const fs = require('fs');

const fileDaily = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesDaily.jsx';
let codeDaily = fs.readFileSync(fileDaily, 'utf8');

const oldClientBlock = `<td style={{ padding: '8px 4px' }}>
                        <div>{row.client_name || row.client || '-'}</div>
                        <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || ''}</div>
                      </td>`;

const newClientBlock = `<td style={{ padding: '8px 4px' }}>
                        <div>{row.client_name || row.client?.client_name || row.client || '-'}</div>
                        <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || row.client?.phone || row.client?.client_phone || (clients.find(c => c.id == row.client_id)?.phone) || ''}</div>
                      </td>`;

if (codeDaily.includes(oldClientBlock)) {
    codeDaily = codeDaily.replace(oldClientBlock, newClientBlock);
    fs.writeFileSync(fileDaily, codeDaily);
    console.log("Updated client phone in SalesDaily.jsx");
} else {
    console.log("Could not find client block in SalesDaily");
}

const fileAll = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesAll.jsx';
let codeAll = fs.readFileSync(fileAll, 'utf8');

const oldClientAll = `<td style={{ padding: '6px 4px', textAlign: 'center' }}>{row.client_name || row.client?.client_name || '-'}</td>`;
const newClientAll = `<td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <div>{row.client_name || row.client?.client_name || '-'}</div>
                        <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || row.client?.phone || row.client?.client_phone || (clients.find(c => c.id == row.client_id)?.phone) || ''}</div>
                      </td>`;

if (codeAll.includes(oldClientAll)) {
    codeAll = codeAll.replace(oldClientAll, newClientAll);
    fs.writeFileSync(fileAll, codeAll);
    console.log("Updated client phone in SalesAll.jsx");
} else {
    console.log("Could not find client block in SalesAll");
}
