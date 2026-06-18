const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'public', 'tools');
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));

const adsenseId = 'ca-pub-6696712816082259';
const analyticsId = 'G-V78ZLHJLR8';

const report = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
  const hasAdsense = content.includes(adsenseId) || content.includes('pagead2.googlesyndication.com');
  const hasAnalytics = content.includes(analyticsId) || content.includes('googletagmanager.com/gtag');
  const hasTitle = /<title>.*?<\/title>/i.test(content);
  const hasMetaDesc = /<meta\s+name="description"\s+content=".*?"\s*\/?>/i.test(content);
  const hasCanonical = /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i.test(content);
  
  report.push({
    file,
    hasAdsense,
    hasAnalytics,
    hasTitle,
    hasMetaDesc,
    hasCanonical
  });
}

const rootFiles = ['index.html', 'about-us.html', 'contact-us.html'].map(f => path.join(__dirname, 'public', f));
for (const file of rootFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  report.push({
    file: path.basename(file),
    hasAdsense: content.includes(adsenseId) || content.includes('pagead2.googlesyndication.com'),
    hasAnalytics: content.includes(analyticsId) || content.includes('googletagmanager.com/gtag'),
    hasTitle: /<title>.*?<\/title>/i.test(content),
    hasMetaDesc: /<meta\s+name="description"\s+content=".*?"\s*\/?>/i.test(content),
    hasCanonical: /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i.test(content)
  });
}

console.log(JSON.stringify(report, null, 2));
