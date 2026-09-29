const fs = require('fs');

// 1. Fix SmsCustomer.jsx pagination
const smsCustomerPath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sms/SmsCustomer.jsx';
let custCode = fs.readFileSync(smsCustomerPath, 'utf8');

custCode = custCode.replace(
    /crmService\s*\.\s*getClients\(\)/,
    "crmService.getClients({ page_size: 5000 })"
);
fs.writeFileSync(smsCustomerPath, custCode);

// 2. Fix SmsComposer.jsx filtering
const smsComposerPath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/SmsComposer.jsx';
let compCode = fs.readFileSync(smsComposerPath, 'utf8');

const poolRegex = /const pool = useMemo\(\(\) => \{[\s\S]*?\}, \[contacts, groups, groupId, search\]\);/;
const newPool = `const pool = useMemo(() => {
      let list = contacts;
      if (groups && groupId) {
        list = list.filter((c) => String(c.group?.id || c.group_id || c.group) === String(groupId));
      }
      if (dueFilter === 'due') {
        list = list.filter((c) => Number(c.due) > 0);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((c) => \`\${c.name || ''} \${c.phone || ''}\`.toLowerCase().includes(q));
      }
      return list;
    }, [contacts, groups, groupId, search, dueFilter]);`;

if (compCode.match(poolRegex)) {
    compCode = compCode.replace(poolRegex, newPool);
    fs.writeFileSync(smsComposerPath, compCode);
    console.log("Fixed filtering and pagination");
} else {
    console.log("Regex not found in SmsComposer");
}
