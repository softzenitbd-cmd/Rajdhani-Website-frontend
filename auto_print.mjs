import fs from 'fs';
let content = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

const newEffect = `
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('barcode-print-mode');
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove('barcode-print-mode');
    }
  }, [isOpen]);
`;

content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen\]\);/, newEffect.trim());

content = content.replace(
  '<div className="modal-content" style={{ maxWidth: \'600px\', width: \'90%\' }}>',
  '<div className="modal-content" style={{ display: \'none\' }}>'
);

fs.writeFileSync('src/components/BarcodePrintModal.jsx', content);
console.log('Modified BarcodePrintModal for auto print');
