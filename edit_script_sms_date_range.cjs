const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add startDate and endDate state
const stateRegex = /const \[searchDate, setSearchDate\] = useState\(''\);/;
const newState = `const [startDate, setStartDate] = useState('');\n  const [endDate, setEndDate] = useState('');`;
if (code.match(stateRegex)) {
    code = code.replace(stateRegex, newState);
} else {
    console.log("Could not find searchDate state declaration");
}

// 2. Update pool logic
const poolRegex = /if \(searchDate\) \{\s*list = list\.filter\(\(c\) => c\.due_date === searchDate\);\s*\}/;
const newPool = `if (startDate || endDate) {
        list = list.filter((c) => {
          if (!c.due_date) return false;
          if (startDate && endDate) {
            return c.due_date >= startDate && c.due_date <= endDate;
          } else if (startDate) {
            return c.due_date >= startDate;
          } else if (endDate) {
            return c.due_date <= endDate;
          }
          return true;
        });
      }`;
if (code.match(poolRegex)) {
    code = code.replace(poolRegex, newPool);
} else {
    console.log("Could not find searchDate filtering logic");
}

// 3. Update the render UI
const renderRegex = /<input type="date" value=\{searchDate\} onChange=\{\(e\) => setSearchDate\(e\.target\.value\)\} style=\{\{ \.\.\.box, width: '130px', padding: '8px 10px' \}\} \/>/;
const newRender = `<div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginRight: '4px' }}>{t("Due Collection")}:</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '4px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} />
                <span style={{ color: '#94a3b8' }}>-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '4px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} />
              </div>`;
if (code.match(renderRegex)) {
    code = code.replace(renderRegex, newRender);
} else {
    console.log("Could not find searchDate input render");
}

// 4. Update dependencies
const depsRegex = /\[contacts, groups, groupId, search, dueFilter, searchDate\]/;
const newDeps = `[contacts, groups, groupId, search, dueFilter, startDate, endDate]`;
if (code.match(depsRegex)) {
    code = code.replace(depsRegex, newDeps);
} else {
    console.log("Could not find dependency array");
}

fs.writeFileSync(filePath, code);
console.log("Updated SmsComposer to use date range filter");
