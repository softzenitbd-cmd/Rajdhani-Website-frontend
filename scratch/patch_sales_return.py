import sys
import re

file_path = r'c:\Users\SoftZen It\rajdhane_garments\src\pages\invoice\SalesReturnCreate.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleSelectProduct to include barcode
handle_select_pattern = r'id: prod\.id,\s*name: prod\.name \|\| prod\.title \|\| "Product",'
handle_select_repl = r'''id: prod.id,
            name: prod.name || prod.title || "Product",
            barcode:
              prod._scannedBarcode ||
              prod.barcode ||
              prod.custom_barcode_no ||
              prod.code ||
              (String(prod.id).length === 36
                ? String(prod.id).substring(0, 8).toUpperCase()
                : prod.id),'''
content = re.sub(handle_select_pattern, handle_select_repl, content)

# 2. Extract handleBarcodeKeyDown to processBarcode and add useEffect
barcode_kd_pattern = r'  const handleBarcodeKeyDown = async \(e\) => \{[\s\S]*?    \}\n  \};\n'
barcode_kd_repl = r'''  const processBarcode = async (rawCode) => {
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
'''
content = content.replace(re.search(barcode_kd_pattern, content).group(0), barcode_kd_repl)

# 3. Update table render to show barcode
table_item_pattern = r'<td style=\{\{\s*padding: "8px",\s*fontWeight: "500"\s*\}\}>\s*\{item\.name\}\s*</td>'
table_item_repl = r'''<td style={{ padding: "8px", fontWeight: "500" }}>
                          {item.name} {item.barcode && <span style={{color: '#64748b', fontSize: '11px', display: 'block'}}>{item.barcode}</span>}
                        </td>'''
content = re.sub(table_item_pattern, table_item_repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done SalesReturnCreate")
