const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const toolsDir = path.join(publicDir, 'tools');

const oldLongSentence = " Built with cutting-edge technology to deliver fast, secure, and professional-grade results right in your browser without any data compromises.";
const shortEnhancement = " Fast & secure.";

// Update index.html
let indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// 1. Revert Phishing Scanner to a shorter description
indexHtml = indexHtml.replace(
  /Advanced AI-powered heuristic scanner for comprehensive link analysis\. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time, ensuring maximum digital security before you even click\./gi,
  "AI-powered heuristic scanner. Proactively detects homograph attacks, typosquatting & hidden malware."
);

// 2. Remove the long sentence from all tool cards and replace with short one
indexHtml = indexHtml.split(oldLongSentence).join(shortEnhancement);

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf8');
console.log('Updated index.html');

// 3. Update all tools in public/tools/
const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));
for (const file of toolFiles) {
  const filePath = path.join(toolsDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Replace phishing scanner long desc
  html = html.replace(/Advanced AI-powered heuristic scanner for comprehensive link analysis\. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time, ensuring maximum digital security before you even click\./g, 
    "AI-powered heuristic scanner. Proactively detects homograph attacks, typosquatting & hidden malware.");
  html = html.replace(/Advanced AI-powered heuristic scanner for comprehensive link analysis\. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time\./g, 
    "AI-powered heuristic scanner. Proactively detects homograph attacks, typosquatting & hidden malware.");

  // Remove the long generic sentence from all files
  html = html.split(oldLongSentence).join(shortEnhancement);

  fs.writeFileSync(filePath, html, 'utf8');
}
console.log('Updated all tool pages with compact descriptions.');
