const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// Add dueFilter state
if (!code.includes('const [dueFilter, setDueFilter] = useState')) {
    code = code.replace(
        /const \[search, setSearch\] = useState\(''\);/,
        "const [search, setSearch] = useState('');\n  const [dueFilter, setDueFilter] = useState('all');"
    );
}

// Update pool logic
code = code.replace(
    /if \(search && !c\.name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) && !\(c\.phone && c\.phone\.includes\(search\)\)\) return false;/,
    "if (dueFilter === 'due' && !(Number(c.due) > 0)) return false;\n    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.phone && c.phone.includes(search))) return false;"
);

// Add select dropdown next to search input
const searchInputRegex = /<input value=\{search\} onChange=\{\(e\) => setSearch\(e\.target\.value\)\} placeholder=\{t\("Search name \/ phone"\)\} style=\{\{ \.\.\.box, padding: '8px 10px' \}\} \/>/;
const newSearchInput = `<select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} style={{ ...box, padding: '8px 10px', width: '130px' }}>
                <option value="all">{t("All Contacts")}</option>
                <option value="due">{t("With Due")}</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search name / phone")} style={{ ...box, flex: 1, padding: '8px 10px' }} />`;

if (code.match(searchInputRegex)) {
    code = code.replace(searchInputRegex, newSearchInput);
}

// Update rendering of c.name to include c.address and red Due amount
const nameRenderRegex = /<span style=\{\{ flex: 1 \}\}>\{c\.name\}<\/span>/;
const newNameRender = `<span style={{ flex: 1 }}>
                      {c.name}
                      {c.address && <span style={{ color: '#64748b', marginLeft: '6px' }}>({c.address})</span>}
                      {Number(c.due) > 0 && <span style={{ color: '#ef4444', marginLeft: '6px', fontWeight: 'bold' }}>(Due: {Number(c.due).toFixed(2)})</span>}
                    </span>`;

if (code.match(nameRenderRegex)) {
    code = code.replace(nameRenderRegex, newNameRender);
}

fs.writeFileSync(filePath, code);
console.log("Updated SmsComposer to have dueFilter and color due amounts red.");
