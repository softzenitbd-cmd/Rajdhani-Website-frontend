const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/<div style=\{\{ padding: '12px', fontSize: 'var\(--fs-18, 18px\)', fontWeight: 'bold', color: '#dc2626' \}\}>৳ \{money\(totalDue\)\}<\/div>\s*<\/div>/g, '');

fs.writeFileSync(filePath, code);
