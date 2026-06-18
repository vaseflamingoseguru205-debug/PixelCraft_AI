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

function getCanonicalSnippet(filename) {
  return `\n  <link rel="canonical" href="https://pixelcraft-ai-94y5.onrender.com/tools/${filename}"/>\n`;
}

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const filename = path.basename(filepath);
  
  if (!content.includes('G-V78ZLHJLR8')) {
    content = content.replace('</head>', `${analyticsSnippet}</head>`);
  }
  if (!content.includes('ca-pub-6696712816082259')) {
    content = content.replace('</head>', `${adsenseSnippet}</head>`);
  }
  if (!content.includes('rel="canonical"')) {
    content = content.replace('</head>', `${getCanonicalSnippet(filename)}</head>`);
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Patched', filepath);
}

['bg-remover.html', 'hashtag-generator.html'].forEach(f => patchFile(path.join(__dirname, 'public', 'tools', f)));
