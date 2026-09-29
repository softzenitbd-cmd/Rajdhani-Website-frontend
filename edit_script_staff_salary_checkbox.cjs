const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffSalaryCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<input type="checkbox" checked=\{staff\.length > 0 && selectedRows\.length === staff\.filter\(\(s\) => Number\(sheet\[s\.id \|\| s\.uuid\]\?\.amount\) > 0\)\.length\} onChange=\{\(e\) => toggleAll\(e\.target\.checked\)\} \/>/;

const newStr = `<input type="checkbox" checked={staff.length > 0 && staff.every((s) => sheet[s.id || s.uuid]?.checked)} onChange={(e) => toggleAll(e.target.checked)} />`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync(filePath, code);
    console.log("Fixed Select All checkbox");
} else {
    console.log("Could not find regex");
}
