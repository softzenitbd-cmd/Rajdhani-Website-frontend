const fs = require('fs');
const files = [
  'src/pages/sales-report/SalesAll.jsx',
  'src/pages/sales-report/SalesCustomerWise.jsx',
  'src/pages/sales-report/SalesDaily.jsx',
  'src/pages/sales-report/SalesGroupWise.jsx',
  'src/pages/sales-report/SalesProductGroupWise.jsx',
  'src/pages/sales-report/SalesProductWise.jsx'
];
for(let f of files) {
  if(!fs.existsSync(f)) continue;
  let code = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  // Add today constant if not exists
  if(!code.includes("const today = new Date().toISOString().split('T')[0];")) {
    code = code.replace(/const \[filters, setFilters\] = useState\(\{/g, "const today = new Date().toISOString().split('T')[0];\n  const [filters, setFilters] = useState({");
    changed = true;
  }
  
  // Replace from_date: '', to_date: '' with today in useState and handleClearFilters
  if(code.includes("from_date: ''") || code.includes("from_date: \"\"")) {
      code = code.replace(/from_date:\s*['"]['"]/g, "from_date: today");
      changed = true;
  }
  if(code.includes("to_date: ''") || code.includes("to_date: \"\"")) {
      code = code.replace(/to_date:\s*['"]['"]/g, "to_date: today");
      changed = true;
  }
  
  if(changed) {
    fs.writeFileSync(f, code);
    console.log('Fixed', f);
  }
}
