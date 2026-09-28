import fs from 'fs';

let pbContent = fs.readFileSync('src/pages/product/ProductBarcode.jsx', 'utf8');

// Update JSBarcode settings for 1.5x1 inch (smaller width, shorter height, smaller font, less margin)
pbContent = pbContent.replace(
  /JsBarcode\([^\{]+\{[\s\S]*?\}\);/,
  `JsBarcode(svgRef.current, String(barcodeValue), {
          format: "CODE128",
          width: 1.2,
          height: 35,
          displayValue: true,
          fontSize: 11,
          font: "monospace",
          margin: 2
        });`
);

// Update HTML styling for the text
const newHTML = `
  return (
    <div className="barcode-sticker-wrapper" style={{ padding: '0px', textAlign: 'center', background: '#ffffff', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000', lineHeight: '1.1' }}>
        {t("RAJDHANI GARMENTS")}
      </div>
      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#000', lineHeight: '1.1', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>

      <div style={{ fontSize: '12px', fontWeight: '900', color: '#000', lineHeight: '1.1', marginTop: '1px' }}>
        {Math.round(Number(price))}
      </div>
      
      {/* Real Scannable SVG Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0', width: '100%' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
      </div>
    </div>
  );
`;

pbContent = pbContent.replace(/return \([\s\S]*?\);\n\};/, newHTML + '\n};');
fs.writeFileSync('src/pages/product/ProductBarcode.jsx', pbContent);
console.log('Updated BarcodeSticker for 1.5x1');
