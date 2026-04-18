const fs = require('fs');
const path = require('path');

const oldUrl = 'pixelcraft-ai-94y5.onrender.com';
const newUrl = 'pixelcraft-ai-94y5.onrender.com';

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldUrl)) {
      const updatedContent = content.split(oldUrl).join(newUrl);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error reading/writing file ${filePath}:`, err.message);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'models') {
        traverseDirectory(fullPath);
      }
    } else {
      if (
        fullPath.endsWith('.html') ||
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.json') ||
        fullPath.endsWith('.xml') ||
        fullPath.endsWith('.txt') ||
        fullPath.endsWith('.md')
      ) {
        replaceInFile(fullPath);
      }
    }
  }
}

traverseDirectory(path.join(__dirname));
console.log('Done replacing URLs.');
