const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace: (row.id ? '#' + String(row.id).split('-')[0].toUpperCase() : ...)
    content = content.replace(/'#' \+ String\(([^)]+)\)\.split\('-'\)\[0\]\.toUpperCase\(\)/g, "String($1).replace(/\\D/g, '').padEnd(6, '0').slice(0, 6)");
    
    // Replace: `INV-${String(p.id).slice(0, 8)}`
    content = content.replace(/\$\{String\(([^)]+)\)\.slice\(0, 8\)\}/g, "${String($1).replace(/\\D/g, '').padEnd(6, '0').slice(0, 6)}");
    
    // Replace standalone slice(0, 8) and split('-')[0]
    content = content.replace(/String\(([^)]+)\)\.split\('-'\)\[0\]/g, "String($1).replace(/\\D/g, '').padEnd(6, '0').slice(0, 6)");
    content = content.replace(/String\(([^)]+)\)\.slice\(0, 8\)/g, "String($1).replace(/\\D/g, '').padEnd(6, '0').slice(0, 6)");

    // Replace `# + String(...)` if any got left behind (we want pure numbers)
    content = content.replace(/'#' \+ String/g, "String");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
        changedCount++;
    }
});
console.log('Total files changed:', changedCount);
