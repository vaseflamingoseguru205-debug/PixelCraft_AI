const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'public', 'tools');
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));

const footerLinks = `
      <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; border-top: 1px solid var(--glass-border); padding-top: 30px;">
        <a href="../privacy-policy.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.95rem; transition: 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">Privacy Policy</a>
        <span style="color: var(--glass-border);">|</span>
        <a href="../terms-conditions.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.95rem; transition: 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">Terms & Conditions</a>
        <span style="color: var(--glass-border);">|</span>
        <a href="../disclaimer.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.95rem; transition: 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">Disclaimer</a>
        <span style="color: var(--glass-border);">|</span>
        <a href="../about-us.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.95rem; transition: 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">About Us</a>
        <span style="color: var(--glass-border);">|</span>
        <a href="../contact-us.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.95rem; transition: 0.3s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-muted)'">Contact Us</a>
      </div>
      <div class="footer-bottom" style="border-top: none; padding-top: 0;">`;

files.forEach(file => {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the footer-bottom element and replace it 
  if (content.includes('<div class="footer-bottom">')) {
     content = content.replace('<div class="footer-bottom">', footerLinks);
     fs.writeFileSync(filePath, content, 'utf8');
     console.log(`Updated footer in: ${file}`);
  }
});

console.log('✅ Footer legal links successfully injected across all tool pages.');
