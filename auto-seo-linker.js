const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'public', 'tools');
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));

const GLOBAL_KEYWORDS = "AI tools, free image editor, artificial intelligence photo editing, free online photo editor, AI background remover, best AI tools, smart resize tool, edit images online, remove background free, AI object remover, photo colorizer AI, image compressor, AI picture editor, best free AI editing tools, online image manipulation, meme generator, damage repair AI, AI outpainting online, top AI tools 2026, free ai photo enhancer, ai text adder, add watermark to photo, ai exif viewer, ai color palette extractor, format converter ai, image cropper, image filters, image to video ai, reverse search ai, business card maker, auto caption generator, face swap ai, pixelcraft ai, alternative to photoshop free online, canva alternative free, best ai design tools, simple ai editor, free alternatives to paid ai, image background transparent, turn text to image, generative ai photo editor, remove objects from photo free, unblur image ai, upscale image up to 4x, online ai photo fix";

// The Related Tools Block we want to ensure exists in EVERY tool.
const relatedToolsHTML = `
      <!-- RELATED TOOLS FOR SEO INTERNAL LINKING -->
      <div style="max-width: 1000px; margin: 60px auto 40px; padding: 0 20px;">
        <div style="padding: 30px; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
          <h3 style="color: #fff; font-size: 1.5rem; margin-bottom: 20px; font-family: 'Outfit', sans-serif;">🔗 Explore More Premium Free Tools</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <a href="ai-content-detector.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
              <div style="font-size: 1.5rem; margin-bottom: 8px;">🕵️‍♂️</div>
              <strong style="display: block; margin-bottom: 4px;">Deep AI Content Detector</strong>
              <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Identify ChatGPT text & deepfake images instantly.</span>
            </a>
            <a href="ai-prompt-humanizer.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
              <div style="font-size: 1.5rem; margin-bottom: 8px;">✍️</div>
              <strong style="display: block; margin-bottom: 4px;">AI Text Humanizer</strong>
              <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Bypass AI detectors with 100% human-like text.</span>
            </a>
            <a href="qr-generator.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
              <div style="font-size: 1.5rem; margin-bottom: 8px;">🔲</div>
              <strong style="display: block; margin-bottom: 4px;">Advanced QR Generator</strong>
              <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Create custom branded QR codes instantly.</span>
            </a>
          </div>
        </div>
      </div>
      <!-- END RELATED TOOLS -->
`;

files.forEach(file => {
  let content = fs.readFileSync(path.join(toolsDir, file), 'utf8');

  // 1. Extract Title and Description
  let titleMatch = content.match(/<title>(.*?)<\/title>/i);
  let descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  
  let title = titleMatch ? titleMatch[1] : `Free Tool - PixelCraft AI`;
  let desc = descMatch ? descMatch[1] : `Use this free tool on PixelCraft AI without any watermark. 100% Free.`;

  let slug = file;
  let canonicalUrl = `https://pixelcraft-ai.onrender.com/tools/${slug}`;

  // 2. Prepare Standard SEO Block
  const seoBlock = `
  <meta name="keywords" content="${GLOBAL_KEYWORDS}"/>
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"/>
  <meta name="author" content="PixelCraft AI"/>
  <link rel="canonical" href="${canonicalUrl}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="PixelCraft AI"/>
  <meta property="og:url" content="${canonicalUrl}"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image" content="https://pixelcraft-ai.onrender.com/og-image.png"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image" content="https://pixelcraft-ai.onrender.com/og-image.png"/>
`;

  // 3. Inject missing SEO tags (if Open Graph isnt there)
  if (!content.includes('og:title')) {
    content = content.replace(/(<meta\s+name=["']description["'][^>]+>)/i, `$1\n${seoBlock}`);
  } else {
    // Or just boldly replace <head> inner content partially?
    // Let's just update the canonical if needed
  }

  // FORCE INJECT CANONICAL if missing and we didnt inject whole block
  if (!content.includes('rel="canonical"')) {
     content = content.replace(/(<title>.*?<\/title>)/i, `$1\n  <link rel="canonical" href="${canonicalUrl}"/>`);
  }

  // 4. Force Inject Google Tag if completely missing
  if (!content.includes('G-886834 VX21') && !content.includes('G-886834VX21')) {
    const gtag = `
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-886834VX21"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-886834VX21');
  </script>`;
    content = content.replace('</head>', `${gtag}\n</head>`);
  }

  // 5. Replace "RELATED TOOLS" section.
  // First, strip old related tools sections to prevent duplicates
  content = content.replace(/<!-- RELATED TOOLS.*?-->[\s\S]*?<!-- END RELATED TOOLS -->/g, '');
  content = content.replace(/<!-- RELATED TOOLS FOR SEO INTERNAL LINKING -->[\s\S]*?<!-- END RELATED TOOLS -->/g, '');
  
  // Insert the fresh Related Tools block right before closing </div> associated with tool workspace, or before <script src="../js/utils.js">
  if (content.includes('<script src="../js/utils.js">')) {
      content = content.replace('<script src="../js/utils.js">', `${relatedToolsHTML}\n  <script src="../js/utils.js">`);
  } else if (content.includes('</body>')) {
      content = content.replace('</body>', `${relatedToolsHTML}\n</body>`);
  }

  fs.writeFileSync(path.join(toolsDir, file), content, 'utf8');
});

console.log('✅ Automated SEO Tags and Internal Linking fixed for all HTML tools.');
