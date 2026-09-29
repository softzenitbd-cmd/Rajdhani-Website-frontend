const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffPaymentCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Update initial state
code = code.replace(/payment_type: 'Salary'/, "payment_type: 'Monthly Salary'");

// Update options
code = code.replace(/\['Salary', 'Advance', 'Bonus', 'Overtime', 'Other'\]/, "['Monthly Salary', 'Weekly Salary', 'Advance', 'Bonus', 'Overtime', 'Other']");

fs.writeFileSync(filePath, code);
console.log("Updated payment types to include Weekly Salary");
