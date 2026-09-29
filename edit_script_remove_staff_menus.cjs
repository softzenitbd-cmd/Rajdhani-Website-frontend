const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/Sidebar.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /<RefreshNavLink to="\/staff\/department"[\s\S]*?<\/RefreshNavLink>\s*<RefreshNavLink to="\/staff\/designation"[\s\S]*?<\/RefreshNavLink>/;

if (code.match(regex)) {
    code = code.replace(regex, '');
    fs.writeFileSync(filePath, code);
    console.log("Removed staff department and designation from Sidebar");
} else {
    console.log("Could not find regex");
}
