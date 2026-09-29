const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /const inputStyle = \{ width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' \};/;
const newStr = `const inputStyle = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', display: 'block', height: '42px', fontSize: '13px' };`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    
    // Convert weekly_salary and monthly_salary type="number" to type="text" to prevent browser extension / native number input styling issues
    code = code.replace(/<input type="number" min="0" step="0\.01" value=\{form\.weekly_salary\}/, `<input type="text" value={form.weekly_salary}`);
    code = code.replace(/<input type="number" min="0" step="0\.01" value=\{form\.monthly_salary\}/, `<input type="text" value={form.monthly_salary}`);

    fs.writeFileSync(filePath, code);
    console.log("Fixed inputStyle and input types");
} else {
    console.log("Could not find inputStyle");
}
