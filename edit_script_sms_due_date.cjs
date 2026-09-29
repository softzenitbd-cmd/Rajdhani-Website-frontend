const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /due: Number\(c\.due \|\| c\.current_due \|\| c\.total_due \|\| c\.balance \|\| c\.previous_due \|\| 0\)/;
const replacement = `due: Number(c.due || c.current_due || c.total_due || c.balance || c.previous_due || 0),
        due_date: c.due_date ? c.due_date.split('T')[0] : null`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsCustomer to map due_date");
} else {
    console.log("Could not find regex in SmsCustomer");
}
