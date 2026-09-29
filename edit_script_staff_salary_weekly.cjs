const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffSalaryCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add salaryType state
code = code.replace(/const \[month, setMonth\] = useState\(now\.getMonth\(\) \+ 1\);/, `const [salaryType, setSalaryType] = useState('Monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);`);

// 2. Remove init logic from initial load and add a separate useEffect
code = code.replace(/const init = \{\};\s*list\.forEach\(\(st\) => \{\s*init\[st\.id \|\| st\.uuid\] = \{ checked: Number\(st\.basic_salary \?\? st\.salary \?\? 0\) > 0, amount: st\.basic_salary \?\? st\.salary \?\? '', note: '' \};\s*\}\);\s*setSheet\(init\);/, '');

const newEffect = `
  useEffect(() => {
    if (staff.length === 0) return;
    const init = {};
    staff.forEach((st) => {
      let amt = 0;
      if (salaryType === 'Weekly') {
        amt = st.weekly_salary ?? 0;
      } else {
        amt = st.monthly_salary ?? st.basic_salary ?? st.salary ?? 0;
      }
      init[st.id || st.uuid] = { checked: Number(amt) > 0, amount: amt || '', note: '' };
    });
    setSheet(init);
  }, [salaryType, staff]);
`;
code = code.replace(/const update = \(id, k, v\) => setSheet\(\(p\) => \(\{ \.\.\.p, \[id\]: \{ \.\.\.p\[id\], \[k\]: v \} \}\)\);/, newEffect + `\n  const update = (id, k, v) => setSheet((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));`);

// 3. Update the label and transaction_type logic based on salaryType
code = code.replace(/const label = \`Salary \$\{MONTHS\[month - 1\]\} \$\{year\}\`;/, `const label = salaryType === 'Weekly' ? \`Weekly Salary \$\{date\}\` : \`Salary \$\{MONTHS[month - 1]\} \$\{year\}\`;`);
code = code.replace(/transaction_type: 'Staff Payment',/g, `transaction_type: 'Staff Payment',`); // Keep Staff Payment, but description tells weekly/monthly

// 4. Add the select box in the UI
const uiSelect = `<div>
              <label style={labelStyle}>{t("Salary Type")}</label>
              <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} style={inputStyle}>
                <option value="Monthly">{t("Monthly")}</option>
                <option value="Weekly">{t("Weekly")}</option>
              </select>
            </div>
            <div>`;
code = code.replace(/<div className="no-print" style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(180px, 1fr\)\)', gap: '16px', marginBottom: '24px' \}\}>\s*<div>/, `<div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>\n            ` + uiSelect);

// Hide month/year if Weekly
code = code.replace(/<div>\s*<label style=\{labelStyle\}>\{t\("Salary Month"\)\}<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<div>\s*<label style=\{labelStyle\}>\{t\("Year"\)\}<\/label>[\s\S]*?<\/select>\s*<\/div>/, `{salaryType === 'Monthly' && (
              <>
                <div>
                  <label style={labelStyle}>{t("Salary Month")}</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={inputStyle}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{t(m)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("Year")}</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}`);

fs.writeFileSync(filePath, code);
console.log("Updated StaffSalaryCreate to handle Weekly salaries");
