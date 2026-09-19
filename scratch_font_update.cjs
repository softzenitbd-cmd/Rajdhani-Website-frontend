const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/fontSize:\s*['"](\d+)px['"]/g, "fontSize: 'var(--fs-$1, $1px)'");
      fs.writeFileSync(fullPath, content, 'utf8');
    } else if (fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/font-size:\s*(\d+)px/g, 'font-size: var(--fs-$1, $1px)');
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('./src');
console.log('Fonts updated successfully');
