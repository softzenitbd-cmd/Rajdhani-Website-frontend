import fs from 'fs';

let content = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

// 1. Hide the modal content completely
content = content.replace(
  '<div className="modal-content" style={{ maxWidth: \'600px\', width: \'90%\', zIndex: 10000 }}>',
  '<div className="modal-content" style={{ display: \'none\' }}>'
);

// 2. Add the auto print back
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
  }, [isOpen, onClose]);
`;
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen\]\);/, newEffect.trim());

fs.writeFileSync('src/components/BarcodePrintModal.jsx', content);
console.log('Removed modal UI and restored auto print');
