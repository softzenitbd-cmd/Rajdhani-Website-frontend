const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\invoice\\SalesReturnCreate.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove header text
const headerText = '| CTRL + S = SAVE | ALT + S = SAVE & PRINT | CTRL + D ={" "}\r\n                  {t("ড্রাফ্ট হিসেবে সংরক্ষণ")}';
content = content.replace(headerText, '| CTRL + S = SAVE | ALT + S = SAVE & PRINT');
// Fallback if formatting differs
const headerText2 = '| CTRL + S = SAVE | ALT + S = SAVE & PRINT | CTRL + D ={" "}\n                  {t("ড্রাফ্ট হিসেবে সংরক্ষণ")}';
content = content.replace(headerText2, '| CTRL + S = SAVE | ALT + S = SAVE & PRINT');

// Also try regex
content = content.replace(/\|\s*CTRL\s*\+\s*D\s*=\s*\{\"\s*\"\}\s*\{t\(\"ড্রাফ্ট হিসেবে সংরক্ষণ\"\)\}/g, "");

// Remove the button
const buttonPattern = /<button\s+type="button"\s+className="btn-primary"\s+onClick=\{\(\) => handleSaveReturn\(0\)\}\s+style=\{\{[\s\S]*?\}\}\s*>\s*\{t\("Save As Draft"\)\}\s*<\/button>/g;
content = content.replace(buttonPattern, "");

// Center the action group
const actionGroupPattern = /className="form-action-group"\s*style=\{\{ display: "flex", gap: "8px" \}\}/g;
content = content.replace(actionGroupPattern, 'className="form-action-group" style={{ display: "flex", gap: "8px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}');

// Add position relative to the footer container to support absolute centering
const footerPattern = /style=\{\{\s*padding: "16px",\s*background: "white",\s*borderTop: "1px solid #e2e8f0",\s*display: "flex",\s*justifyContent: "space-between",\s*alignItems: "center",\s*gap: "12px",\s*\}\}/g;
const footerRepl = `style={{
                padding: "16px",
                background: "white",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                position: "relative"
              }}`;
content = content.replace(footerPattern, footerRepl);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
