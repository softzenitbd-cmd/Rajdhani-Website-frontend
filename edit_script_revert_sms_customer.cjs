const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// The hack was:
//         const dueAmt = Number(c.due || c.current_due || c.total_due || c.balance || c.previous_due || 0);
//         const addr = c.address ? \` (\${c.address})\` : '';
//         let displayName = c.name;
//         if (dueAmt > 0) {
//            displayName = \`\${c.name}\${addr} (Due: \${dueAmt.toFixed(2)})\`;
//         }
//         return { ... name: displayName ... }

// I will just replace the mapping function entirely
const mapRegex = /\.then\(\(r\) => setContacts\(toList\(r\)\.map\(\(c\) => \{[\s\S]*?\}\)\)\)/;
const cleanMap = `.then((r) => setContacts(toList(r).map((c) => ({
        id: c.id || c.uuid,
        name: c.name,
        phone: c.phone || c.mobile,
        group: c.group,
        address: c.address,
        due: Number(c.due || c.current_due || c.total_due || c.balance || c.previous_due || 0)
      }))))`;

if (code.match(mapRegex)) {
    code = code.replace(mapRegex, cleanMap);
    fs.writeFileSync(filePath, code);
    console.log("Reverted hack in SmsCustomer");
} else {
    console.log("Regex not found in SmsCustomer");
}
