import fs from 'fs';
let bpmContent = fs.readFileSync('src/components/BarcodePrintModal.jsx', 'utf8');

// Hide border during print
const printCSS = `
          body.barcode-print-mode .barcode-sticker-wrapper {
            border: none !important;
          }
`;

bpmContent = bpmContent.replace(
  'body.barcode-print-mode svg {',
  printCSS.trim() + '\n          body.barcode-print-mode svg {'
);

fs.writeFileSync('src/components/BarcodePrintModal.jsx', bpmContent);
