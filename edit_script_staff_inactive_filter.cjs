const fs = require('fs');

const filterLogic = `.filter(st => st.status !== 'inactive' && st.status !== 0 && st.status !== false)`;

// 1. StaffSalaryCreate.jsx
let f1 = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffSalaryCreate.jsx';
let code1 = fs.readFileSync(f1, 'utf8');
code1 = code1.replace(/const list = toList\(s\);/, `const list = toList(s)${filterLogic};`);
fs.writeFileSync(f1, code1);

// 2. StaffPaymentCreate.jsx
let f2 = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffPaymentCreate.jsx';
let code2 = fs.readFileSync(f2, 'utf8');
code2 = code2.replace(/setStaff\(toList\(s\)\);/, `setStaff(toList(s)${filterLogic});`);
fs.writeFileSync(f2, code2);

// 3. StaffAttendanceCreate.jsx
let f3 = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffAttendanceCreate.jsx';
let code3 = fs.readFileSync(f3, 'utf8');
code3 = code3.replace(/const list = toList\(await staffApi\.getStaffList\(\)\);/, `const list = toList(await staffApi.getStaffList())${filterLogic};`);
fs.writeFileSync(f3, code3);

// 4. StaffMonthlyAttendanceReport.jsx
let f4 = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffMonthlyAttendanceReport.jsx';
let code4 = fs.readFileSync(f4, 'utf8');
code4 = code4.replace(/setStaff\(toList\(r\)\)/, `setStaff(toList(r)${filterLogic})`);
fs.writeFileSync(f4, code4);

// 5. StaffSalaryReport.jsx
let f5 = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffSalaryReport.jsx';
let code5 = fs.readFileSync(f5, 'utf8');
code5 = code5.replace(/setStaff\(toList\(r\)\)/, `setStaff(toList(r)${filterLogic})`);
fs.writeFileSync(f5, code5);

console.log("Filtered out inactive staff from dropdowns and sheets");
