const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(srcDir);
files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace various empty calls with page_size: 5000
    if (content.includes('crmService.getClients()')) {
        content = content.replace(/crmService\.getClients\(\)/g, 'crmService.getClients({ page_size: 5000 })');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
console.log('Global replace done');
