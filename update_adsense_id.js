const fs = require('fs');
const path = require('path');

const oldId = '6696712816082259';
const newId = '6696712816082259';

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldId)) {
      const updatedContent = content.split(oldId).join(newId);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated Adsense ID: ${filePath}`);
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
        fullPath.endsWith('.txt')
      ) {
        replaceInFile(fullPath);
      }
    }
  }
}

traverseDirectory(path.join(__dirname));
console.log('Done replacing Adsense ID.');
