import fs from 'fs';
const content = fs.readFileSync('src/pages/product/PurchaseCreate.jsx', 'utf8');

const regex = /<button[\s\S]*?\{t\("Cancel"\)\}[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?\{t\("Save As Draft"\)\}[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?\{t\("Save & Print"\)\}[\s\S]*?<\/button>[\s\S]*?<button([\s\S]*?)\{t\("Submit Purchase"\)\}([\s\S]*?)<\/button>/g;

const newContent = content.replace(regex, '<button$1{t("Buy")}$2</button>');
fs.writeFileSync('src/pages/product/PurchaseCreate.jsx', newContent);
console.log('Replaced with a single Buy button safely.');
