const fs = require('fs');
let c = fs.readFileSync('src/pages/staff/StaffPaymentReport.jsx', 'utf8');
c = c.replace(/import CustomDatePicker from '\.\.\/\.\.\/components\/CustomDatePicker';/, "import CustomDatePicker from '../../components/CustomDatePicker';\nimport { fmtDate } from '../../utils/apiHelpers';");
c = c.replace(/row\.date \? String\(row\.date\)\.split\('T'\)\[0\] : t\("N\/A"\)/g, 'row.date ? fmtDate(row.date) : t("N/A")');
fs.writeFileSync('src/pages/staff/StaffPaymentReport.jsx', c);
console.log("Done");
