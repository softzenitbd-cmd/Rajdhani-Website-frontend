const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// The current layout has:
// <div style={{ width: '90px', textAlign: 'right' }}> ... c.phone ... </div>
// and Name span.

// Replace the Name span to include the phone
const nameRegex = /<span style=\{\{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' \}\}>\s*\{c\.client_id \? \`\(\\\$\{c\.client_id\}\) \` : ''\}\{c\.name\}\s*<\/span>/;
const newName = `<span style={{ fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name} {c.phone ? <span style={{ color: '#64748b', fontWeight: '500' }}>({c.phone})</span> : ''}
                      </span>`;

if (code.match(nameRegex)) {
    code = code.replace(nameRegex, newName);
} else {
    console.log("Could not find name regex");
}

// Remove the phone column
const phoneColRegex = /<div style=\{\{ width: '90px', textAlign: 'right' \}\}>\s*<span style=\{\{ color: c\.phone \? '#475569' : '#ef4444', fontWeight: '500', fontSize: '12px' \}\}>\s*\{c\.phone \|\| t\("N\/A"\)\}\s*<\/span>\s*<\/div>/;

if (code.match(phoneColRegex)) {
    code = code.replace(phoneColRegex, '');
    fs.writeFileSync(filePath, code);
    console.log("Updated SmsComposer to put phone in parenthesis next to name");
} else {
    console.log("Could not find phone column regex");
}
