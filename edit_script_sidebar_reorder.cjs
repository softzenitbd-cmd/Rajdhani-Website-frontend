const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/Sidebar.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const allOld = `                <RefreshNavLink to="/sales-report/all" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.all')}
                </RefreshNavLink>
                <RefreshNavLink to="/sales-report/barcode-search" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.barcode_search')}
                </RefreshNavLink>
                <RefreshNavLink to="/sales-report/daily" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.daily')}
                </RefreshNavLink>`;

const allNew = `                <RefreshNavLink to="/sales-report/daily" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.daily')}
                </RefreshNavLink>
                <RefreshNavLink to="/sales-report/all" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.all')}
                </RefreshNavLink>
                <RefreshNavLink to="/sales-report/barcode-search" className={({isActive}) => \`submenu-item \${isActive ? 'active' : ''}\`}>
                  <span style={{ marginRight: '8px' }}>»</span> {t('sidebar.barcode_search')}
                </RefreshNavLink>`;

code = code.replace(allOld, allNew);

fs.writeFileSync(filePath, code);
console.log("Reordered Sales Report submenu items");
