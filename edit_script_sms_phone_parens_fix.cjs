const fs = require('fs');
const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const target = "{c.client_id ? `(${c.client_id}) ` : ''}{c.name}";
const replacement = "{c.name} {c.phone ? <span style={{ color: '#64748b', fontWeight: '500' }}>({c.phone})</span> : ''}";

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Successfully replaced name span to include phone");
} else {
    console.log("Target string not found!");
}
