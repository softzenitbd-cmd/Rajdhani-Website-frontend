import fs from 'fs';
let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

const regex = /<RefreshNavLink to="\/product\/purchase\/invoice-list"[\s\S]*?<\/RefreshNavLink>\s*/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/Sidebar.jsx', content);
console.log('Removed using regex');
