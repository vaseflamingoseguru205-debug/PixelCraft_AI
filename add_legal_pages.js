const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const toolsDir = path.join(publicDir, 'tools');
const blogDir = path.join(publicDir, 'blog');

const legalTemplate = (title, content, rootPrefix) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | PixelCraft AI</title>
  <meta name="description" content="${title} for PixelCraft AI." />
  <link rel="stylesheet" href="${rootPrefix}css/style.css">
  <link rel="stylesheet" href="${rootPrefix}css/tool.css">
  <style>
    .legal-content { max-width: 900px; margin: 0 auto; padding: 100px 20px; line-height: 1.8; color: #cbd5e1; font-size: 1.1rem; }
    .legal-content h1 { color: #fff; font-size: 3rem; margin-bottom: 30px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 15px;}
    .legal-content h2 { color: #38bdf8; font-size: 2rem; margin-top: 40px; margin-bottom: 15px; }
    .legal-content p { margin-bottom: 20px; }
    .legal-content ul { margin-bottom: 20px; padding-left: 25px; }
  </style>
</head>
<body>
  <nav class="navbar" id="navbar">
    <a href="${rootPrefix}index.html" class="nav-logo">🛡️ PixelCraft AI</a>
    <ul class="nav-links">
      <li><a href="${rootPrefix}index.html#tools">Tools</a></li>
      <li><a href="${rootPrefix}blog.html">Blog</a></li>
    </ul>
  </nav>

  <main>
    <article class="legal-content">
      <h1>${title}</h1>
      ${content}
    </article>
  </main>
  
  <footer class="footer" style="background: #0f172a; padding: 40px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 60px;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-bottom: 20px;">
        <a href="${rootPrefix}about.html" style="color: #94a3b8; text-decoration: none;">About Us</a>
        <a href="${rootPrefix}privacy.html" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a>
        <a href="${rootPrefix}terms.html" style="color: #94a3b8; text-decoration: none;">Terms of Service</a>
        <a href="${rootPrefix}disclaimer.html" style="color: #94a3b8; text-decoration: none;">Disclaimer</a>
        <a href="${rootPrefix}index.html#contact" style="color: #94a3b8; text-decoration: none;">Contact</a>
      </div>
      <p style="color: #64748b; font-size: 0.95rem;">&copy; 2026 PixelCraft AI. All rights reserved. A Decentralized Privacy & Security Toolset.</p>
    </div>
  </footer>
</body>
</html>`;

const privacyContent = `
<h2>1. Introduction</h2>
<p>Welcome to PixelCraft AI. Your privacy is of paramount importance to us. This Privacy Policy outlines our strict operational standards regarding your personal information. Because our platform is fundamentally built on decentralized, client-side processing, our policy is incredibly simple: <strong>We do not collect, store, or sell your files.</strong></p>

<h2>2. Information We Do Not Collect</h2>
<p>Unlike traditional SaaS applications, PixelCraft AI operates almost entirely within your browser's local memory (via WebAssembly and WebGL).</p>
<ul>
  <li><strong>Your Files:</strong> Images, audio files, PDFs, and documents processed using our tools are never uploaded to our servers. They remain entirely on your local machine.</li>
  <li><strong>Your Cryptographic Keys:</strong> Passwords and AES-256 keys used in our steganography and cryptography tools are processed locally and destroyed the moment you close the browser tab.</li>
  <li><strong>Your Output Data:</strong> Any generated media (compressed files, removed backgrounds) is rendered locally and downloaded directly to your hard drive.</li>
</ul>

<h2>3. Information We Do Collect Automatically</h2>
<p>To keep the website operational, secure, and optimized, we use standard analytics and hosting infrastructure that may temporarily log:</p>
<ul>
  <li>IP Addresses (for DDOS protection and server routing).</li>
  <li>Browser type and OS (to ensure WebAssembly compatibility).</li>
  <li>Time of access and referring website addresses.</li>
</ul>

<h2>4. Third-Party Advertising (Google AdSense)</h2>
<p>We use third-party advertising companies to serve ads when you visit our website. These companies (including Google) may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
<ul>
  <li>Google, as a third-party vendor, uses cookies to serve ads on our site.</li>
  <li>Google's use of the DART cookie enables it to serve ads to our users based on their visit to our sites and other sites on the Internet.</li>
  <li>Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy.</li>
</ul>

<h2>5. Cookies and Web Beacons</h2>
<p>Like any other website, PixelCraft AI uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

<h2>6. Consent</h2>
<p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
`;

const termsContent = `
<h2>1. Acceptance of Terms</h2>
<p>By accessing and using PixelCraft AI ("the Website"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

<h2>2. Description of Service</h2>
<p>PixelCraft AI provides users with access to a rich collection of client-side digital tools, including but not limited to image editors, steganography engines, AI detectors, and cryptographic utilities. You understand and agree that the Service is provided "AS-IS" and that PixelCraft AI assumes no responsibility for the deletion, mis-delivery, or failure to store any user communications or personalization settings.</p>

<h2>3. User Conduct and Responsibilities</h2>
<p>You agree to use the tools provided by PixelCraft AI for lawful purposes only. Because our tools operate locally on your device, we have no mechanism to monitor your usage. However, you are strictly prohibited from using our steganography, digital fingerprint wipers, or cryptographic tools for:</p>
<ul>
  <li>The transmission of illegal, illicit, or harmful content.</li>
  <li>Conducting cyber-attacks, phishing, or distributing malware.</li>
  <li>Violating the intellectual property rights of others.</li>
</ul>

<h2>4. Limitation of Liability</h2>
<p>Under no circumstances shall PixelCraft AI, its developers, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages that result from the use of, or the inability to use, the materials and tools on this site. You acknowledge that cryptographic software can be subject to undiscovered flaws, and you use these tools at your own risk.</p>
<p>The tools are provided without any warranty of any kind, either express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

<h2>5. Modifications to Service</h2>
<p>PixelCraft AI reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that PixelCraft AI shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
`;

const aboutContent = `
<h2>Who We Are</h2>
<p>PixelCraft AI is a decentralized collective of privacy advocates, cybersecurity researchers, and open-source developers. We believe that in the age of algorithmic surveillance and data harvesting, privacy is a fundamental human right. Our mission is to democratize access to military-grade digital security tools by making them available entirely within the web browser.</p>

<h2>Our Philosophy: The Client-Side Revolution</h2>
<p>For too long, users have been forced to trade their privacy for utility. If you wanted to compress an image, remove a background using AI, or encrypt a file, you had to upload that file to a corporate server. Once uploaded, your data was out of your control.</p>
<p>We are changing that. By utilizing modern web technologies like WebAssembly (Wasm) and WebGL, we have built an entire suite of powerful utilities that run 100% locally on your device's CPU and GPU. The processing code comes to you; your data never leaves your machine.</p>

<h2>What We Offer</h2>
<p>Our platform currently hosts over 30 specialized tools, categorized into four main domains:</p>
<ul>
  <li><strong>Digital Privacy & OPSEC:</strong> Tools to wipe EXIF data, destroy PRNU sensor fingerprints, and scan for homograph phishing attacks.</li>
  <li><strong>Advanced Steganography:</strong> Secure engines that utilize AES-256 and Quantization Index Modulation to hide encrypted messages inside audio, video, and image files.</li>
  <li><strong>Local AI Manipulation:</strong> Neural networks that run directly in your browser to remove backgrounds, detect AI-generated text, and humanize synthetic content.</li>
  <li><strong>Secure Media Conversion:</strong> Fast, local utilities to convert formats, compress files, and handle PDFs without third-party APIs.</li>
</ul>

<h2>Support Our Mission</h2>
<p>PixelCraft AI is entirely free to use. We rely on ethical advertising and community support to maintain our infrastructure. By using our tools and reading our blog, you are participating in the fight for a decentralized, secure, and private internet.</p>
`;

const disclaimerContent = `
<h2>1. General Information</h2>
<p>The information and tools provided by PixelCraft AI are for educational, informational, and personal security purposes only. While we strive to provide the highest quality cryptographic and utility software, all tools are provided "as is" and "as available" without any guarantees or warranties of any kind, either express or implied.</p>

<h2>2. Security and Cryptography Disclaimer</h2>
<p>While our steganography and encryption tools utilize industry-standard algorithms (such as AES-256), the field of cryptography is constantly evolving. We cannot guarantee that our tools are immune to future cryptanalysis, quantum computing attacks, or undiscovered zero-day vulnerabilities. Furthermore, because our tools run entirely in the browser environment, they may be susceptible to local malware, keyloggers, or compromised operating systems present on your specific device.</p>
<p><strong>PixelCraft AI is not a substitute for comprehensive endpoint security or professional OPSEC consulting.</strong> You should not rely on these tools alone to protect life-critical or highly sensitive classified information against state-level adversaries.</p>

<h2>3. Professional Advice</h2>
<p>The content published on our blog regarding cybersecurity, OPSEC, and digital forensics is intended for general knowledge and educational use. It does not constitute formal legal or professional cybersecurity advice. If you require specialized assistance, you should consult a certified cybersecurity professional or legal counsel.</p>

<h2>4. External Links</h2>
<p>Our website may contain links to external websites that are not provided or maintained by or in any way affiliated with PixelCraft AI. Please note that PixelCraft AI does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>
`;

fs.writeFileSync(path.join(publicDir, 'privacy.html'), legalTemplate("Privacy Policy", privacyContent, ""));
fs.writeFileSync(path.join(publicDir, 'terms.html'), legalTemplate("Terms of Service", termsContent, ""));
fs.writeFileSync(path.join(publicDir, 'about.html'), legalTemplate("About Us", aboutContent, ""));
fs.writeFileSync(path.join(publicDir, 'disclaimer.html'), legalTemplate("Disclaimer", disclaimerContent, ""));


// Now, let's update EVERY single HTML file on the site to include this robust footer
const robustFooterHTML = (rootPrefix) => `
  <!-- MASSIVE LEGAL FOOTER FOR ADSENSE -->
  <footer class="footer" style="background: #0f172a; padding: 40px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 60px;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-bottom: 20px;">
        <a href="${rootPrefix}about.html" style="color: #94a3b8; text-decoration: none; font-weight: 500;">About Us</a>
        <a href="${rootPrefix}privacy.html" style="color: #94a3b8; text-decoration: none; font-weight: 500;">Privacy Policy</a>
        <a href="${rootPrefix}terms.html" style="color: #94a3b8; text-decoration: none; font-weight: 500;">Terms of Service</a>
        <a href="${rootPrefix}disclaimer.html" style="color: #94a3b8; text-decoration: none; font-weight: 500;">Disclaimer</a>
        <a href="${rootPrefix}index.html#contact" style="color: #94a3b8; text-decoration: none; font-weight: 500;">Contact</a>
      </div>
      <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
        &copy; 2026 PixelCraft AI. All rights reserved.<br>
        A Decentralized Privacy, Cryptography & Digital Security Toolset.
      </p>
    </div>
  </footer>
`;

function replaceFooter(dir, rootPrefix) {
  const files = fs.readdirSync(dir);
  let c = 0;
  for(const file of files) {
    if (file.endsWith('.html')) {
      const p = path.join(dir, file);
      let content = fs.readFileSync(p, 'utf8');
      
      // Simple regex to replace existing <footer class="footer">...</footer>
      const footerRegex = /<footer class="footer"[^>]*>[\s\S]*?<\/footer>/;
      if (footerRegex.test(content)) {
        content = content.replace(footerRegex, robustFooterHTML(rootPrefix));
        fs.writeFileSync(p, content);
        c++;
      }
    }
  }
  return c;
}

const c1 = replaceFooter(publicDir, "");
const c2 = replaceFooter(toolsDir, "../");
const c3 = replaceFooter(blogDir, "../");

console.log('Legal pages created! Updated footer in ' + (c1+c2+c3) + ' files.');
