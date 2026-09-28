import fs from 'fs';
let content = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

content = content.replace(
  '<div className="modal-overlay no-print-overlay" style={{ zIndex: 9999 }}>',
  '<div className="modal-overlay no-print-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", zIndex: 99999 }}>'
);
fs.writeFileSync('src/components/BarcodePrintModal.jsx', content);
console.log('Updated styles');
