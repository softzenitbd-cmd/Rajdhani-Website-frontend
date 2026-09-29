const fs = require('fs');
const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/Sidebar.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const barcodeIndex = lines.findIndex(l => l.includes('to="/sales-report/barcode-search"'));
if (barcodeIndex !== -1) {
    // comment out 3 lines
    lines[barcodeIndex] = '{/* ' + lines[barcodeIndex];
    lines[barcodeIndex + 2] = lines[barcodeIndex + 2] + ' */}';
}

const customerIndex = lines.findIndex(l => l.includes('to="/sales-report/customer-wise"'));
if (customerIndex !== -1) {
    // comment out 3 lines
    lines[customerIndex] = '{/* ' + lines[customerIndex];
    lines[customerIndex + 2] = lines[customerIndex + 2] + ' */}';
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Successfully hidden barcode and customer wise sales report");
