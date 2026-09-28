import fs from 'fs';

let content = fs.readFileSync('src/pages/product/PurchaseList.jsx', 'utf8');

const regex = /<div style=\{\{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' \}\}>[\s\S]*?<h2 style=\{\{ fontFamily: 'monospace', fontSize: 'var\(--fs-24, 24px\)', fontWeight: 'bold' \}\}>\{t\("Purchase List"\)\}<\/h2>[\s\S]*?<button[\s\S]*?<\/button>[\s\S]*?<\/div>/;

const newTitle = `
      <div className="premium-header" style={{ padding: '16px 24px', background: '#22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 'var(--fs-16, 16px)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t("Purchase List")}
        </div>
        <button 
          onClick={() => navigate('/product/purchase/add-new')}
          className="btn" 
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
        >
          <Plus size={16} /> {t("Purchase")}
        </button>
      </div>`;

content = content.replace(regex, newTitle.trim());

content = content.replace(
  '<tr style={{ background: \'#94a3b8\', color: \'black\' }}>',
  '<tr style={{ background: \'#64748b\', color: \'white\' }}>'
);
content = content.replace(/borderRight: '1px solid #cbd5e1'/g, "borderRight: '1px solid rgba(255,255,255,0.2)'");
content = content.replace(/borderBottom: '1px solid #cbd5e1'/g, "borderBottom: '1px solid rgba(255,255,255,0.2)'");
content = content.replace(/border: '1px solid #38bdf8'/g, "border: '1px solid #cbd5e1'");

fs.writeFileSync('src/pages/product/PurchaseList.jsx', content);
console.log('Updated PurchaseList UI');
