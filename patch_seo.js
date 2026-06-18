const fs = require('fs');
const path = require('path');

const analyticsSnippet = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V78ZLHJLR8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-V78ZLHJLR8');
</script>
`;

const adsenseSnippet = `
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6696712816082259"
     crossorigin="anonymous"></script>
`;

function getCanonicalSnippet(filename, isTool) {
  const basePath = isTool ? 'tools/' : '';
  return `\n  <link rel="canonical" href="https://pixelcraft-ai-94y5.onrender.com/${basePath}${filename}"/>\n`;
}

function patchFile(filepath, isTool) {
  let content = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  
  if (!content.includes('G-V78ZLHJLR8')) {
    content = content.replace('</head>', `${analyticsSnippet}</head>`);
  }
  if (!content.includes('ca-pub-6696712816082259')) {
    content = content.replace('</head>', `${adsenseSnippet}</head>`);
  }
  if (!content.includes('rel="canonical"')) {
    content = content.replace('</head>', `${getCanonicalSnippet(filename, isTool)}</head>`);
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Patched', filepath);
}

const filesToPatch = [
  { path: path.join(__dirname, 'public', 'tools', 'anti-ai-cloak.html'), isTool: true },
  { path: path.join(__dirname, 'public', 'tools', 'quantum-visual-crypto.html'), isTool: true },
  { path: path.join(__dirname, 'public', 'tools', 'secret-image.html'), isTool: true },
  { path: path.join(__dirname, 'public', 'tools', 'decoy-steganography.html'), isTool: true },
  { path: path.join(__dirname, 'public', 'about-us.html'), isTool: false },
  { path: path.join(__dirname, 'public', 'contact-us.html'), isTool: false }
];

filesToPatch.forEach(f => {
  if (fs.existsSync(f.path)) {
    patchFile(f.path, f.isTool);
  } else {
    console.log('File not found:', f.path);
  }
});
