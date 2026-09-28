import fs from 'fs';

let content = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

// 1. Restore visibility of the modal content
content = content.replace(
  '<div className="modal-content" style={{ display: \'none\' }}>',
  '<div className="modal-content" style={{ maxWidth: \'600px\', width: \'90%\', zIndex: 10000 }}>'
);

// 2. Remove auto-print from useEffect
const newEffect = `
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('barcode-print-mode');
    } else {
      document.body.classList.remove('barcode-print-mode');
    }
    return () => document.body.classList.remove('barcode-print-mode');
  }, [isOpen]);
`;
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen, onClose\]\);/, newEffect.trim());
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen\]\);/, newEffect.trim());

// 3. Update the print CSS to enforce page breaks and full label size for each sticker
const printCSS = `
      <style>{\`
        @media print {
          @page { margin: 0; size: auto; }
          body.barcode-print-mode * {
            visibility: hidden !important;
          }
          body.barcode-print-mode .print-only-container,
          body.barcode-print-mode .print-only-container * {
            visibility: visible !important;
          }
          body.barcode-print-mode .print-only-container {
            display: block !important;
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          body.barcode-print-mode .single-barcode-print-wrapper {
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            page-break-after: always;
            break-after: page;
          }
          body.barcode-print-mode .barcode-sticker-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2px !important;
          }
          body.barcode-print-mode svg {
            width: 100% !important;
            height: auto !important;
            max-height: 80%;
          }
          .print-header { display: none !important; }
        }
      \`}</style>
`;
content = content.replace(/<style>\{[\s\S]*?\}<\/style>/, printCSS.trim());

fs.writeFileSync('src/components/BarcodePrintModal.jsx', content);
console.log('Fixed auto print and page break');
