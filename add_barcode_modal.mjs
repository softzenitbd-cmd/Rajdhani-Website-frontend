import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');
let modified = false;

// 1. Add import
if (!content.includes('import BarcodePrintModal')) {
    content = content.replace(
        "import FormSettingsModal from '../../components/FormSettingsModal';",
        "import FormSettingsModal from '../../components/FormSettingsModal';\nimport BarcodePrintModal from '../../components/BarcodePrintModal';"
    );
    modified = true;
}

// 2. Add state
if (!content.includes('const [barcodeProductToPrint')) {
    content = content.replace(
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
        "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [barcodeProductToPrint, setBarcodeProductToPrint] = useState(null);"
    );
    modified = true;
}

// 3. Update handleAddProduct
const oldHandle = `      setProducts(prev => [...prev, newProd]);
      handleSelectProduct(newProd.id);
      setIsProductModalOpen(false);`;

const newHandle = `      setProducts(prev => [...prev, newProd]);
      handleSelectProduct(newProd.id);
      setIsProductModalOpen(false);
      setBarcodeProductToPrint(newProd);`;

if (content.includes(oldHandle)) {
    content = content.replace(oldHandle, newHandle)
                     .replace(oldHandle.replace(/\n/g, '\r\n'), newHandle);
    modified = true;
}

// 4. Add the component before FormSettingsModal
if (!content.includes('<BarcodePrintModal')) {
    content = content.replace(
        "      <FormSettingsModal",
        "      <BarcodePrintModal \n        isOpen={!!barcodeProductToPrint}\n        onClose={() => setBarcodeProductToPrint(null)}\n        product={barcodeProductToPrint}\n      />\n\n      <FormSettingsModal"
    );
    modified = true;
}

if (modified) {
    fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
    console.log('Barcode modal added to PurchaseCreate');
} else {
    console.log('No modifications made');
}
