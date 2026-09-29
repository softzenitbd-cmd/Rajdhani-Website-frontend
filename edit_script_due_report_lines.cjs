const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

let newLines = [];
let i = 0;
while (i < lines.length) {
    if (lines[i].includes('t("PREVIOUS DUE")')) {
        newLines.push(lines[i]);
        newLines.push(lines[i].replace('PREVIOUS DUE', 'SALES'));
        newLines.push(lines[i].replace('PREVIOUS DUE', 'SALES RETURN'));
        newLines.push(lines[i].replace('PREVIOUS DUE', 'TOTAL BILL'));
        newLines.push(lines[i].replace('PREVIOUS DUE', 'COLLECTION'));
        newLines.push(lines[i].replace('PREVIOUS DUE', 'DUE'));
        i += 7; // skip the next 6 lines
        continue;
    }
    if (lines[i].includes('money(r.prevDue)')) {
        newLines.push(lines[i]); // prevDue
        newLines.push(lines[i+1]); // sales
        newLines.push(lines[i+3]); // salesReturn
        newLines.push(lines[i+2]); // totalBill
        newLines.push(lines[i+4]); // collection
        newLines.push(lines[i+6]); // due
        i += 7; // skip the next 6 lines
        continue;
    }
    newLines.push(lines[i]);
    i++;
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log("Updated table in ClientDueReport using line parsing");
