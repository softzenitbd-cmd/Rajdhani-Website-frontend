import fs from 'fs';
let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
const oldLink = `                    <RefreshNavLink to="/product/purchase/invoice-list" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`} style={{ paddingLeft: '48px' }}>
                      <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.purchase_invoice_list')}
                    </RefreshNavLink>`;

content = content.replace(oldLink, '');
fs.writeFileSync('src/components/Sidebar.jsx', content);
console.log('Removed Purchase Invoice List from Sidebar');
