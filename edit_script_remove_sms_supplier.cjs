const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/Sidebar.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Remove supplier and supplier group from SMS menu
const supplierRegex = /<RefreshNavLink to="\/sms\/supplier"[\s\S]*?<\/RefreshNavLink>\s*/;
const supplierGroupRegex = /<RefreshNavLink to="\/sms\/supplier-group"[\s\S]*?<\/RefreshNavLink>\s*/;

code = code.replace(supplierRegex, '');
code = code.replace(supplierGroupRegex, '');

fs.writeFileSync(filePath, code);
console.log('Removed SMS Supplier and Supplier Group from Sidebar');
