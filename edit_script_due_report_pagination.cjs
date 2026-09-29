const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes("import Pagination from")) {
    code = code.replace(/import TableToolbar from '.\/TableToolbar';/, `import TableToolbar from './TableToolbar';\nimport Pagination from './Pagination';`);
}

// 1. Add currentPage state
if (!code.includes("const [currentPage, setCurrentPage] = useState(1);")) {
    code = code.replace(/const \[entries, setEntries\] = useState\(100\);/, `const [entries, setEntries] = useState(50);\n  const [currentPage, setCurrentPage] = useState(1);`);
}

// 2. Reset page on filter change
if (!code.includes("setCurrentPage(1)")) {
    code = code.replace(/const filtered = normalized/, `useEffect(() => { setCurrentPage(1); }, [clientId, groupId, search, onlyDue, entries]);\n\n  const filtered = normalized`);
}

// 3. Update visible slice
code = code.replace(/const visible = \(grouped \|\| filtered\)\.slice\(0, entries\);/, `const visible = (grouped || filtered).slice((currentPage - 1) * entries, currentPage * entries);`);

// 4. Update SL number to be continuous across pages
code = code.replace(/\{ SL: i \+ 1, /g, `{ SL: (currentPage - 1) * entries + i + 1, `);
code = code.replace(/<td style=\{td\}>\{i \+ 1\}<\/td>/, `<td style={td}>{(currentPage - 1) * entries + i + 1}</td>`);

// 5. Add Pagination component after the table
const paginationCode = `
          <div style={{ marginTop: '16px' }}>
            <Pagination 
              currentPage={currentPage}
              totalItems={(grouped || filtered).length}
              pageSize={entries}
              onPageChange={setCurrentPage}
            />
          </div>
`;

if (!code.includes("<Pagination")) {
    code = code.replace(/<\/table>\s*<\/div>/, `</table>\n          </div>${paginationCode}`);
}

// 6. Make Total Due banner better
const newTotalDue = `<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '12px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t("Total Due Amount")}</div>
              <div style={{ fontSize: 'var(--fs-22, 22px)', fontWeight: 'bold', color: '#dc2626' }}>৳ {money(totalDue)}</div>
            </div>
          </div>`;

code = code.replace(/<div style=\{\{ textAlign: 'center', marginBottom: '24px', border: '1px solid #94a3b8' \}\}>[\s\S]*?<\/div>/, newTotalDue);

fs.writeFileSync(filePath, code);
console.log("Added pagination and updated total amount display in ClientDueReport");
