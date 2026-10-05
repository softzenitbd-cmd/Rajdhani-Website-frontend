const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\invoice\\SalesReturnCreate.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The function we want to replace starts with "const handleBarcodeKeyDown = async (e) => {"
// and ends with "};" before "const updateItemField".
const startIndex = content.indexOf('const handleBarcodeKeyDown = async (e) => {');
const endIndex = content.indexOf('const updateItemField =', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const oldBlock = content.substring(startIndex, endIndex);
    
    const newBlock = `const processBarcode = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) return;
    const code = rawCode.trim().toLowerCase();
    let prod = products.find(
      (p) =>
        String(p.code || "").trim().toLowerCase() === code ||
        String(p.barcode || "").trim().toLowerCase() === code ||
        String(p.custom_barcode_no || "").trim().toLowerCase() === code ||
        String(p.id).trim().toLowerCase() === code ||
        (code.length >= 8 && String(p.id).trim().toLowerCase().startsWith(code)) ||
        String(p.product_code || "").trim().toLowerCase() === code,
    );

    if (!prod) {
      prod = await productService.findByBarcode(rawCode);
      if (prod) {
        setProducts((prev) =>
          prev.find((p) => String(p.id) === String(prod.id)) ? prev : [...prev, prod],
        );
      }
    }

    if (prod) {
      handleSelectProduct(prod.id, {
        ...prod,
        _scannedBarcode: rawCode.trim(),
      });
    } else {
      toast.error(
        t('Product with barcode "{{v0}}" not found.', { v0: rawCode.trim() }),
      );
    }
    setFormData((prev) => ({ ...prev, barcode: "" }));
  };

  useEffect(() => {
    if (!formData.barcode) return;
    const timer = setTimeout(() => {
      processBarcode(formData.barcode);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.barcode]);

  const handleBarcodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.target.value;
      setFormData((prev) => ({ ...prev, barcode: "" }));
      await processBarcode(val);
    }
  };

  `;

    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully replaced handleBarcodeKeyDown");
} else {
    console.log("Could not find block boundaries.");
}
