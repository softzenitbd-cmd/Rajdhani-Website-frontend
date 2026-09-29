const fs = require('fs');
const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/Sidebar.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the index of the daily link
const allIndex = lines.findIndex(l => l.includes('to="/sales-report/all"'));
const barcodeIndex = lines.findIndex(l => l.includes('to="/sales-report/barcode-search"'));
const dailyIndex = lines.findIndex(l => l.includes('to="/sales-report/daily"'));

if (allIndex !== -1 && barcodeIndex !== -1 && dailyIndex !== -1) {
    const allBlock = lines.splice(allIndex, 3);
    const barcodeBlock = lines.splice(barcodeIndex - 3, 3);
    const dailyBlock = lines.splice(dailyIndex - 6, 3);

    // Now insert them in the new order: daily, all, barcode
    lines.splice(allIndex, 0, ...dailyBlock, ...allBlock, ...barcodeBlock);
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("Successfully reordered!");
} else {
    console.log("Could not find the lines");
}
