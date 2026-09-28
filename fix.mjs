import fs from 'fs';
let content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

let modified = false;

// 1. Change card header background
if (content.includes("padding: '16px 24px', background: 'white'")) {
  content = content.replace(
    "padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'",
    "padding: '16px 24px', background: '#22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center'"
  );
  modified = true;
}

// 2. Change premium-title text color
if (content.includes("textTransform: 'uppercase'")) {
  content = content.replace(
    "fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase'",
    "fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase', color: 'black'"
  );
  modified = true;
}

// 3. Update Barcode and Product search fields
const barcodeOld = `<div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    left: "20px",
                    background: "var(--primary)",
                    color: "white",
                    padding: "2px 8px",
                    fontSize: "var(--fs-10, 10px)",
                    borderRadius: "4px",
                    zIndex: 2,
                  }}
                >
                  {t("Barcode Number")}
                </div>`;

if (content.includes('left: "20px"')) {
    content = content.replace(barcodeOld, '<BadgeLabel text={t("Barcode Number")} />')
                    .replace(barcodeOld.replace(/\n/g, '\r\n'), '<BadgeLabel text={t("Barcode Number")} />');
    modified = true;
}

const barcodeBorderOld = `<div
                  style={{
                    display: "flex",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: "white",
                  }}
                >`;
const barcodeBorderNew = `<div
                  style={{
                    display: "flex",
                    border: "1px solid #0ea5e9",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "white",
                  }}
                >`;

if (content.includes('border: "1px solid #e2e8f0"')) {
    content = content.replace(barcodeBorderOld, barcodeBorderNew)
                     .replace(barcodeBorderOld.replace(/\n/g, '\r\n'), barcodeBorderNew);
    modified = true;
}

const prodSearchOld = `              <div
                className="form-group"
                style={{ marginBottom: "0", position: "relative" }}
                onKeyDownCapture={(e) => {`;
const prodSearchNew = `              <div
                className="form-group"
                style={{ marginBottom: "0", position: "relative", border: "1px solid #0ea5e9", borderRadius: "8px", padding: "1px" }}
                onKeyDownCapture={(e) => {`;

if (content.includes('style={{ marginBottom: "0", position: "relative" }}')) {
    content = content.replace(prodSearchOld, prodSearchNew)
                     .replace(prodSearchOld.replace(/\n/g, '\r\n'), prodSearchNew);
    modified = true;
}

const selectOld = `              >
                <SearchableSelect
                  id="productSearchDropdown"`;
const selectNew = `              >
                <BadgeLabel text={t("Product Name")} />
                <SearchableSelect
                  id="productSearchDropdown"`;

if (content.includes('id="productSearchDropdown"')) {
    content = content.replace(selectOld, selectNew)
                     .replace(selectOld.replace(/\n/g, '\r\n'), selectNew);
    modified = true;
}

if (modified) {
    fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', content);
    console.log('Fixed Barcode section');
} else {
    console.log('No matches found to modify');
}
