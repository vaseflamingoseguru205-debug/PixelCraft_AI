const fs = require('fs');
const path = require('path');

const adsenseCode = `
  <!-- Google AdSense -->
  <meta name="google-adsense-account" content="ca-pub-6696712816082259">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6696712816082259"
     crossorigin="anonymous"></script>
`;

function getAllHtmlFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllHtmlFiles(path.join(dirPath, file), arrayOfFiles);
    } else if (file.endsWith('.html')) {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });
  return arrayOfFiles;
}

const htmlFiles = getAllHtmlFiles('d:/AI tools Website/public');
let updatedCount = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove existing Google AdSense comments
  content = content.replace(/[ \t]*<!--\s*Google AdSense\s*-->[\r\n]*/gi, '');
  
  // Remove existing adsense meta tags
  content = content.replace(/[ \t]*<meta\s+name=["']google-adsense-account["'][^>]*>[\r\n]*/gi, '');
  
  // Remove existing adsense scripts (multiline friendly)
  // Need to use [\s\S]*? up to </script> to ensure any newline inside the script tag doesn't break regex
  content = content.replace(/[ \t]*<script[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^>]+>[\s\S]*?<\/script>[\r\n]*/gi, '');

  // Insert the new tags immediately before </head>
  if (content.match(/<\/head>/i)) {
    content = content.replace(/<\/head>/i, `${adsenseCode}</head>`);
    updatedCount++;
    fs.writeFileSync(file, content, 'utf8');
  } else {
    console.log(`WARNING: </head> not found in ${file}`);
  }
}

// Overwrite the ads.txt file
const adsTxtContent = 'google.com, pub-6696712816082259, DIRECT, f08c47fec0942fa0\n';
fs.writeFileSync('d:/AI tools Website/public/ads.txt', adsTxtContent, 'utf8');
// Check root ads.txt as well
if (fs.existsSync('d:/AI tools Website/ads.txt')) {
    fs.writeFileSync('d:/AI tools Website/ads.txt', adsTxtContent, 'utf8');
}

console.log(`Updated AdSense on ${updatedCount} files successfully.`);
