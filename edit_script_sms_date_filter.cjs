const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add searchDate state
if (!code.includes('const [searchDate, setSearchDate] = useState')) {
    code = code.replace(
        /const \[search, setSearch\] = useState\(''\);/,
        "const [search, setSearch] = useState('');\n  const [searchDate, setSearchDate] = useState('');"
    );
}

// Update pool logic
if (!code.includes('if (searchDate)')) {
    const poolRegex = /if \(search\) \{/;
    const newPoolStr = `if (searchDate) {
        list = list.filter((c) => c.due_date === searchDate);
      }
      if (search) {`;
    code = code.replace(poolRegex, newPoolStr);
}

// Add Date input
if (!code.includes('type="date" value={searchDate}')) {
    const inputRegex = /<input value=\{search\} onChange=\{\(e\) => setSearch\(e\.target\.value\)\}/;
    const newInputStr = `<input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ ...box, width: '130px', padding: '8px 10px' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}`;
    code = code.replace(inputRegex, newInputStr);
}

// Ensure useMemo dependency is updated
if (!code.includes('searchDate, dueFilter]')) {
    code = code.replace(
        /\[contacts, groups, groupId, search, dueFilter\]/,
        "[contacts, groups, groupId, search, dueFilter, searchDate]"
    );
}

fs.writeFileSync(filePath, code);
console.log("Updated SmsComposer to include date filter");
