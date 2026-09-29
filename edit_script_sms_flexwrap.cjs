const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<div style=\{\{ display: 'flex', gap: '8px', marginBottom: '8px' \}\}>/;
const newStr = `<div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync(filePath, code);
}
