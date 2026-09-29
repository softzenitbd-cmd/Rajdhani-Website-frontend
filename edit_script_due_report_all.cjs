const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Change default of onlyDue to false
code = code.replace(/const \[onlyDue, setOnlyDue\] = useState\(true\);/, `const [onlyDue, setOnlyDue] = useState(false);`);

fs.writeFileSync(filePath, code);
console.log("Set default of onlyDue to false to show all clients by default in Due Report");
