const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\invoice\\SalesReturnCreate.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldFooterStart = content.indexOf('justifyContent: "space-between",\r\n                alignItems: "center",\r\n                gap: "12px",\r\n                position: "relative"');
if (oldFooterStart !== -1) {
    // I will replace the whole footer div
    const searchString = `              <div
                style={{
                  padding: "16px",
                  background: "white",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  position: "relative"
                }}
              >
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => navigate("/invoice/sales-return/list")}
                  style={{
                    background: "var(--danger)",
                    padding: "10px 24px",
                    fontSize: "var(--fs-14, 14px)",
                    borderRadius: "4px",
                  }}
                >
                  {t("Cancel")}
                </button>
                <div
                  className="form-action-group"
                  style={{ display: "flex", gap: "8px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}
                >
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSaveReturn(1, true)}
                    style={{
                      background: "#3b82f6",
                      padding: "10px 24px",
                      fontSize: "var(--fs-14, 14px)",
                      borderRadius: "4px",
                    }}
                  >
                    {t("Save & Print")}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleSaveReturn(1)}
                    style={{
                      background: isEdit ? "#000000" : "var(--success)",
                      color: "white",
                      padding: "10px 24px",
                      fontSize: "var(--fs-14, 14px)",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {isEdit ? t("Update Return") : t("Return Invoice")}
                  </button>
                </div>
              </div>`;

    const newFooter = `              <div
                style={{
                  padding: "16px",
                  background: "white",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => navigate("/invoice/sales-return/list")}
                  style={{
                    background: "var(--danger)",
                    padding: "10px 24px",
                    fontSize: "var(--fs-14, 14px)",
                    borderRadius: "4px",
                  }}
                >
                  {t("Cancel")}
                </button>
                
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSaveReturn(1, true)}
                  style={{
                    background: "#3b82f6",
                    padding: "10px 24px",
                    fontSize: "var(--fs-14, 14px)",
                    borderRadius: "4px",
                  }}
                >
                  {t("Save & Print")}
                </button>
                
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSaveReturn(1)}
                  style={{
                    background: isEdit ? "#000000" : "var(--success)",
                    color: "white",
                    padding: "10px 24px",
                    fontSize: "var(--fs-14, 14px)",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  {isEdit ? t("Update Return") : t("Return Invoice")}
                </button>
              </div>`;
              
    content = content.replace(searchString, newFooter);
    
    // Fallback if formatting differs slightly
    const flexPattern = /<div\s+className="form-action-group"\s+style=\{\{\s*display:\s*"flex",\s*gap:\s*"8px",\s*position:\s*"absolute",\s*left:\s*"50%",\s*transform:\s*"translateX\(-50%\)"\s*\}\}\s*>/g;
    content = content.replace(flexPattern, '');
    const divEndPattern = /<\/button>\s*<\/div>\s*<\/div>/g;
    content = content.replace(divEndPattern, '</button>\n              </div>');
    const footerWrapper = /position: "relative"/g;
    content = content.replace(footerWrapper, '/* centered via flex */');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated footer");
} else {
    console.log("Could not find footer pattern");
}
