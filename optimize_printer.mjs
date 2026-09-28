import fs from 'fs';

// 1. Modify ProductBarcode.jsx to add a class to the sticker container
let pbContent = fs.readFileSync('src/pages/product/ProductBarcode.jsx', 'utf8');
pbContent = pbContent.replace(
  "border: '1px dashed #94a3b8', padding: '6px', borderRadius: '4px', textAlign: 'center', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'",
  "padding: '6px', textAlign: 'center', background: '#ffffff'"
).replace(
  "<div style={{ padding:",
  "<div className=\"barcode-sticker-wrapper\" style={{ padding:"
);
fs.writeFileSync('src/pages/product/ProductBarcode.jsx', pbContent);

// 2. Modify BarcodePrintModal.jsx to maximize for label printer
let bpmContent = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');
bpmContent = bpmContent.replace(
  "<div key={idx} style={{ width: '160px' }}>",
  "<div key={idx} className=\"single-barcode-print-wrapper\">"
);

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
            display: flex !important;
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            justify-content: center;
            align-items: center;
          }
          body.barcode-print-mode .single-barcode-print-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
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

bpmContent = bpmContent.replace(/<style>\{[\s\S]*?\}<\/style>/, printCSS.trim());
fs.writeFileSync('src/components/BarcodePrintModal.jsx', bpmContent);
console.log('Optimized for Label Printer');
