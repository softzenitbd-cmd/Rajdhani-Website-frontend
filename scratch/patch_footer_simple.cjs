const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\invoice\\SalesReturnCreate.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<div\s*className="form-action-group"[\s\S]*?>\s*(<button[\s\S]*?<\/button>)\s*(<button[\s\S]*?<\/button>)\s*<\/div>/;
const match = content.match(regex);
if (match) {
    const replacement = `${match[1]}\n                ${match[2]}`;
    content = content.replace(match[0], replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Replaced form-action-group");
} else {
    console.log("Failed to match form-action-group");
}
