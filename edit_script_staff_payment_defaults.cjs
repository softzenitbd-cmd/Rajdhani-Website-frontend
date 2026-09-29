const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/staff/StaffPaymentCreate.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /const loadLists = async \(\) => \{[\s\S]*?setCategories\(toList\(c\)\);/;
const newLoadLists = `const loadLists = async () => {
    try {
      const [s, a, c] = await Promise.all([
        staffApi.getStaffList(),
        accountingService.getAccounts(),
        accountingService.getExpenseCategories(),
      ]);
      
      const accountsList = toList(a);
      const categoriesList = toList(c);
      
      setStaff(toList(s));
      setAccounts(accountsList);
      setCategories(categoriesList);

      setForm((prev) => {
        let next = { ...prev };
        if (!next.account) {
          const defaultAcc = accountsList.find(acc => acc.name && acc.name.toUpperCase().includes('TOTAL'));
          if (defaultAcc) next.account = defaultAcc.id || defaultAcc.uuid;
        }
        if (!next.category) {
          const defaultCat = categoriesList.find(cat => cat.name && (cat.name.toUpperCase().includes('STAF') || cat.name.toUpperCase().includes('STAFF')));
          if (defaultCat) next.category = defaultCat.id || defaultCat.uuid;
        }
        return next;
      });`;

if (code.match(regex)) {
    code = code.replace(regex, newLoadLists);
    fs.writeFileSync(filePath, code);
    console.log("Updated StaffPaymentCreate defaults");
} else {
    console.log("Could not find loadLists");
}
