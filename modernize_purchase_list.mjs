import fs from 'fs';

let content = fs.readFileSync('src/pages/product/PurchaseInvoiceList.jsx', 'utf8');

// Update title bar
const oldTitle = `<div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px', position: 'relative' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Product Wise Purchase List")}</h2>
        <button 
          onClick={() => navigate('/product/purchase/add-new')}
          className="btn" 
          style={{ position: 'absolute', right: '20px', top: '0', background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Plus size={16} /> {t("Purchase")}
        </button>
      </div>`;

const newTitle = `<div className="premium-header" style={{ padding: '16px 24px', background: '#22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 'var(--fs-16, 16px)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t("Product Wise Purchase List")}
        </div>
        <button 
          onClick={() => navigate('/product/purchase/add-new')}
          className="btn" 
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
        >
          <Plus size={16} /> {t("Purchase")}
        </button>
      </div>`;

content = content.replace(oldTitle, newTitle);

// Update table header
content = content.replace(
  '<tr style={{ background: \'#94a3b8\', color: \'black\' }}>',
  '<tr style={{ background: \'#64748b\', color: \'white\' }}>'
);
content = content.replace(/borderRight: '1px solid #cbd5e1'/g, "borderRight: '1px solid rgba(255,255,255,0.2)'");
content = content.replace(/borderBottom: '1px solid #cbd5e1'/g, "borderBottom: '1px solid rgba(255,255,255,0.2)'");
content = content.replace(/borderBottom: '1px solid #cbd5e1'/g, "borderBottom: '1px solid rgba(255,255,255,0.2)'"); // some might not have Right border

// Make input borders cleaner
content = content.replace(/border: '1px solid #38bdf8'/g, "border: '1px solid #cbd5e1'");
content = content.replace(/border: '1px solid #cbd5e1'/g, "border: '1px solid #cbd5e1'");

fs.writeFileSync('src/pages/product/PurchaseInvoiceList.jsx', content);
console.log('Updated PurchaseInvoiceList UI');
