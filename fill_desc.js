const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const toolsDir = path.join(publicDir, 'tools');

const oldShort = " Fast & secure.";
const newLong = " Fast & secure. All processing happens locally on your device ensuring absolute privacy. Enjoy premium features instantly, completely free and without any registration.";

// Update index.html
let indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
indexHtml = indexHtml.split(oldShort).join(newLong);
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf8');
console.log('Updated index.html');

// Update all tools in public/tools/
const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));
for (const file of toolFiles) {
  const filePath = path.join(toolsDir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.split(oldShort).join(newLong);
  fs.writeFileSync(filePath, html, 'utf8');
}
console.log('Updated all tool pages with fuller descriptions.');
