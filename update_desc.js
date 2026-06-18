const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const toolsDir = path.join(publicDir, 'tools');

const enhancementSentence = " Built with cutting-edge technology to deliver fast, secure, and professional-grade results right in your browser without any data compromises.";

// Update index.html
let indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// 1. Fix Phishing Scanner specifically
indexHtml = indexHtml.replace(
  /100% accurate AI heuristic scanner\. Detects homograph attacks, typosquatting & hidden malware\./gi,
  "Advanced AI-powered heuristic scanner for comprehensive link analysis. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time, ensuring maximum digital security before you even click."
);

// 2. Append enhancement to all tool cards in index.html
// The tool cards are like: <a href="/tools/..." class="tool-card ..."> ... <p>Some description</p> ... </a>
// We can use a regex to match the <p> content inside tool-card.
const toolCardRegex = /(<a[^>]*class="tool-card[^>]*>[\s\S]*?<p>)([\s\S]*?)(<\/p>)/g;
indexHtml = indexHtml.replace(toolCardRegex, (match, p1, p2, p3) => {
  // If the description doesn't already have our enhancement sentence, append it
  let desc = p2.trim();
  if (!desc.includes("Built with cutting-edge")) {
    desc += enhancementSentence;
  }
  return p1 + desc + p3;
});

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf8');
console.log('Updated index.html');

// 3. Update all tools in public/tools/
const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));
for (const file of toolFiles) {
  const filePath = path.join(toolsDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Fix phishing scanner meta tags and JSON-LD
  if (file === 'phishing-scanner.html') {
    html = html.replace(/100% accurate AI-powered phishing and malware link scanner\. Detect homograph attacks, typosquatting, and hidden threats before you click\./g, 
      "Advanced AI-powered heuristic scanner for comprehensive link analysis. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time, ensuring maximum digital security before you even click.");
    html = html.replace(/100% accurate AI-powered phishing and malware link scanner\. Detect homograph attacks, typosquatting, and hidden threats\./g, 
      "Advanced AI-powered heuristic scanner for comprehensive link analysis. Proactively detect homograph attacks, typosquatting, and hidden malware threats in real-time.");
  }

  // Remove "100% accurate" anywhere else just in case
  html = html.replace(/100% accurate /gi, "Highly advanced ");

  // Enhance the tool page subtitle
  // Usually it's something like <p class="subtitle" ...> or just <p> inside a hero section.
  // We'll target: <p style="...color: var(--text-muted)..."> or <p style="color: #94a3b8; font-size: 1.1rem; max-width: 600px; margin: 0 auto 30px;">
  // Let's just find the first paragraph after the h1
  const h1Regex = /(<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>)([\s\S]*?)(<\/p>)/i;
  html = html.replace(h1Regex, (match, p1, p2, p3) => {
    let desc = p2.trim();
    if (!desc.includes("Built with cutting-edge")) {
      desc += enhancementSentence;
    }
    return p1 + desc + p3;
  });

  fs.writeFileSync(filePath, html, 'utf8');
}
console.log('Updated all tool pages.');
