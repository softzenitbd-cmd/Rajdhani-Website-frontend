const fs = require('fs');

// 1. Update SmsCustomer to grab client_id or code
const customerPath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let custCode = fs.readFileSync(customerPath, 'utf8');

const regexMap = /address: c\.address \|\| c\.client_address \|\| \(c\.details && c\.details\.address\) \|\| '',/;
const newMap = `address: c.address || c.client_address || (c.details && c.details.address) || '',
        client_id: c.client_id || c.customer_id || c.code || '',`;

if (custCode.match(regexMap)) {
    custCode = custCode.replace(regexMap, newMap);
    fs.writeFileSync(customerPath, custCode);
} else {
    console.log("Could not find address map in SmsCustomer");
}

// 2. Update SmsComposer to show client_id
const compPath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let compCode = fs.readFileSync(compPath, 'utf8');

const nameRender = /<span style=\{\{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' \}\}>\{c\.name\}<\/span>/;
const newNameRender = `<span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.client_id ? \`(\${c.client_id}) \` : ''}{c.name}
                      </span>`;

if (compCode.match(nameRender)) {
    compCode = compCode.replace(nameRender, newNameRender);
    fs.writeFileSync(compPath, compCode);
    console.log("Updated SmsComposer to show client_id");
} else {
    console.log("Could not find name span in SmsComposer");
}
