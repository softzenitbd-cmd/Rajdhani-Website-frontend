const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\.map\(\(c\) => \(\{ id: c\.id \|\| c\.uuid, name: c\.name, phone: c\.phone \|\| c\.mobile, group: c\.group \}\)\)/;
const replacement = `.map((c) => {
        const dueAmt = Number(c.due || c.current_due || c.total_due || c.balance || c.previous_due || 0);
        let displayName = c.name;
        if (dueAmt > 0) {
           displayName = \`\${c.name} (ID: \${c.id || c.uuid}) (Due: \${dueAmt.toFixed(2)})\`;
        }
        return { 
           id: c.id || c.uuid, 
           name: displayName, 
           phone: c.phone || c.mobile, 
           group: c.group,
           due: dueAmt
        };
      })`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsCustomer to show ID and Due for clients with due");
} else {
    console.log("Regex not found in SmsCustomer");
}
