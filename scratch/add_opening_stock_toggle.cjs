const fs = require('fs');

// 1. Update ProductCreate.jsx
let pcCode = fs.readFileSync('src/pages/product/ProductCreate.jsx', 'utf8');

// Add state
if (!pcCode.includes('showOpeningStock')) {
  pcCode = pcCode.replace(
    /const \[submitting, setSubmitting\] = useState\(false\);/,
    `const [submitting, setSubmitting] = useState(false);\n  const [showOpeningStock, setShowOpeningStock] = useState(false);`
  );

  const pcTarget = /\{\/\*\s*Opening Stock\s*\*\/\}\s*<div className="form-group" style=\{\{ marginBottom: 0 \}\}>\s*<label style=\{\{ display: 'block', marginBottom: '8px', fontSize: 'var\(--fs-13, 13px\)', fontWeight: '600', color: '#334155' \}\}>\s*\{t\("Opening Stock"\)\}\s*<\/label>\s*<input type="number" step="0\.01" name="opening_stock" value=\{formData\.opening_stock\} onChange=\{handleChange\} placeholder="0" disabled=\{isEditMode\} style=\{\{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var\(--fs-14, 14px\)', background: isEditMode \? '#e2e8f0' : '#f8fafc', cursor: isEditMode \? 'not-allowed' : 'text' \}\} \/>\s*<\/div>/;

  const pcReplacement = `{/* Opening Stock */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', margin: 0 }}>
                    {t("Opening Stock")}
                  </label>
                  {!isEditMode && (
                    <label className="switch" style={{ margin: 0, transform: 'scale(0.8)' }}>
                      <input 
                        type="checkbox" 
                        checked={showOpeningStock} 
                        onChange={(e) => {
                          setShowOpeningStock(e.target.checked);
                          if (!e.target.checked) setFormData(prev => ({...prev, opening_stock: ''}));
                        }} 
                      />
                      <span className="slider round"></span>
                    </label>
                  )}
                </div>
                {(showOpeningStock || isEditMode) && (
                  <input type="number" step="0.01" name="opening_stock" value={formData.opening_stock} onChange={handleChange} placeholder="0" disabled={isEditMode} style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: isEditMode ? '#e2e8f0' : '#f8fafc', cursor: isEditMode ? 'not-allowed' : 'text' }} />
                )}
              </div>`;

  pcCode = pcCode.replace(pcTarget, pcReplacement);
  fs.writeFileSync('src/pages/product/ProductCreate.jsx', pcCode);
  console.log('Updated ProductCreate.jsx');
}

// 2. Update AddProductModal.jsx
let amCode = fs.readFileSync('src/components/AddProductModal.jsx', 'utf8');

if (!amCode.includes('showOpeningStock')) {
  amCode = amCode.replace(
    /const \[submitting, setSubmitting\] = useState\(false\);/,
    `const [submitting, setSubmitting] = useState(false);\n  const [showOpeningStock, setShowOpeningStock] = useState(false);`
  );

  const amTarget = /\{\/\*\s*Opening Stock\s*\*\/\}\s*<div className="form-group" style=\{\{ marginBottom: 0 \}\}>\s*<label style=\{\{ display: 'block', marginBottom: '8px', fontSize: 'var\(--fs-13, 13px\)', fontWeight: '600', color: '#334155' \}\}>\s*\{t\("Opening Stock"\)\}\s*<\/label>\s*<input type="number" step="0\.01" name="opening_stock" value=\{formData\.opening_stock\} onChange=\{handleChange\} placeholder="0" style=\{\{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var\(--fs-14, 14px\)', background: '#f8fafc' \}\} \/>\s*<\/div>/;

  const amReplacement = `{/* Opening Stock */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155', margin: 0 }}>
                      {t("Opening Stock")}
                    </label>
                    <label className="switch" style={{ margin: 0, transform: 'scale(0.8)' }}>
                      <input 
                        type="checkbox" 
                        checked={showOpeningStock} 
                        onChange={(e) => {
                          setShowOpeningStock(e.target.checked);
                          if (!e.target.checked) setFormData(prev => ({...prev, opening_stock: ''}));
                        }} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  {showOpeningStock && (
                    <input type="number" step="0.01" name="opening_stock" value={formData.opening_stock} onChange={handleChange} placeholder="0" style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }} />
                  )}
                </div>`;

  amCode = amCode.replace(amTarget, amReplacement);
  fs.writeFileSync('src/components/AddProductModal.jsx', amCode);
  console.log('Updated AddProductModal.jsx');
}
