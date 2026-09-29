const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = "displayName = `${c.name} (ID: ${c.id || c.uuid}) (Due: ${dueAmt.toFixed(2)})`;";
const replacementStr = `
           const addr = c.address ? \` (\${c.address})\` : '';
           displayName = \`\${c.name}\${addr} (Due: \${dueAmt.toFixed(2)})\`;
`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsCustomer to show Address instead of UUID (String replace)");
} else {
    console.log("String not found in SmsCustomer");
}
