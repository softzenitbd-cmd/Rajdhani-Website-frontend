const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const oldMapRegex = /address: c\.address,/;
const newMapStr = `address: c.address || c.client_address || (c.details && c.details.address) || '',`;

if (code.match(oldMapRegex)) {
    code = code.replace(oldMapRegex, newMapStr);
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsCustomer to robustly extract address");
} else {
    console.log("Regex not found in SmsCustomer");
}
