const fs = require('fs');
const path = require('path');

// 1. Add Related Tools to all HTML tools
const toolsDir = path.join(__dirname, 'public', 'tools');
const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html'));

const relatedSection = `
  <!-- RELATED TOOLS FOR SEO INTERNAL LINKING -->
  <div style="max-width: 1000px; margin: 40px auto; padding: 0 20px;">
    <div style="padding: 30px; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <h3 style="color: #fff; font-size: 1.5rem; margin-bottom: 20px; font-family: 'Outfit', sans-serif;">🔗 Explore More Free Tools</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
        <a href="background-remover.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">✂️</div>
          <strong style="display: block; margin-bottom: 4px;">Background Remover</strong>
          <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Remove image backgrounds automatically using AI.</span>
        </a>
        <a href="resume-architect.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">📑</div>
          <strong style="display: block; margin-bottom: 4px;">AI Resume Builder</strong>
          <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Generate an ATS-optimized professional resume.</span>
        </a>
        <a href="avatar-generator.html" style="text-decoration: none; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); color: #fff; transition: 0.3s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">👤</div>
          <strong style="display: block; margin-bottom: 4px;">Avatar Generator</strong>
          <span style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; display: block;">Convert photos to cartoon, anime, and 3D.</span>
        </a>
      </div>
    </div>
  </div>
`;

let updatedCount = 0;
for (const file of toolFiles) {
  const fp = path.join(toolsDir, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('Explore More Free Tools')) continue;

  if (content.includes('<script src="../js/utils.js"></script>')) {
    content = content.replace('<script src="../js/utils.js"></script>', relatedSection + '\n  <script src="../js/utils.js"></script>');
    fs.writeFileSync(fp, content, 'utf8');
    updatedCount++;
  } else if (content.includes('</body>')) {
    content = content.replace('</body>', relatedSection + '\n</body>');
    fs.writeFileSync(fp, content, 'utf8');
    updatedCount++;
  }
}

// 2. Create Blogs Directory and an SEO Blog Post
const blogsDir = path.join(__dirname, 'public', 'blog');
if (!fs.existsSync(blogsDir)) {
  fs.mkdirSync(blogsDir, { recursive: true });
}

const blogHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>How to Remove Background from Image Free Online | PixelCraft AI Blog</title>
  <meta name="description" content="Learn how to easily remove the background from any image for free online using AI. A complete step-by-step guide with tools and tips."/>
  <meta name="robots" content="index, follow"/>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="stylesheet" href="../css/style.css"/>
  <style>
    .blog-container { max-width: 800px; margin: 40px auto; padding: 20px; color: var(--text-main); font-family: 'Inter', sans-serif; line-height: 1.8; }
    .blog-container h1 { font-family: 'Outfit', sans-serif; font-size: 2.5rem; margin-bottom: 20px; color: #fff; }
    .blog-container h2 { font-family: 'Outfit', sans-serif; font-size: 1.8rem; margin: 40px 0 16px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
    .blog-container p { margin-bottom: 20px; font-size: 1.1rem; color: #cbd5e1; }
    .blog-container img { width: 100%; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .blog-container .cta-box { background: rgba(37, 99, 235, 0.1); padding: 30px; border-radius: 16px; border: 1px solid rgba(37, 99, 235, 0.3); text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="../index.html" class="nav-logo"><div class="nav-logo-icon">🎨</div> PixelCraft AI</a>
    <ul class="nav-links">
      <li><a href="../index.html#tools">All Tools</a></li>
    </ul>
  </nav>

  <div class="blog-container">
    <div style="color: var(--primary); font-weight: 700; margin-bottom: 10px; text-transform: uppercase;">Image Editing Guides</div>
    <h1>How to Remove Background from Any Image in 3 Seconds (Free & No Signup)</h1>
    <p>Removing the background from an image used to require advanced Photoshop skills, the magic wand tool, and an hour of frustrating pixel-perfect selection. However, thanks to the recent advancements in Artificial Intelligence, you can now remove the background from any photo in under 3 seconds completely free online.</p>
    
    <h2>Why Remove Image Backgrounds?</h2>
    <p>Whether you are creating a professional LinkedIn profile picture, preparing product images for your e-commerce store, or designing a YouTube thumbnail, having a transparent background is essential. It allows you to place the subject on any color or backdrop.</p>

    <!-- Visual Example -->
    <div style="background:var(--glass-bg); padding:40px; text-align:center; border-radius:12px; margin:20px 0; border:1px dashed rgba(255,255,255,0.2);">
      <h3 style="color:#fff;">✂️ AI Magic Example</h3>
      <p style="margin-bottom:0;">Before: Messy Background → After: Perfectly Transparent PNG</p>
    </div>

    <h2>Step-by-Step Guide</h2>
    <p>Follow these three incredibly simple steps to erase your background instantly using PixelCraft AI.</p>

    <h3 style="color: #fff; margin-top: 30px;">Step 1: Open the Background Remover Tool</h3>
    <p>First, navigate to the <a href="../tools/background-remover.html" style="color:var(--primary); text-decoration:underline;">Free AI Background Remover</a> page. There is no need to create an account or provide your email.</p>

    <h3 style="color: #fff; margin-top: 30px;">Step 2: Upload Your Image</h3>
    <p>Drag and drop your JPG or PNG file directly into the upload area. Ideally, images where the subject is in focus and there is some contrast with the background work best. However, modern AI models can even perfectly extract fine hair details.</p>

    <h3 style="color: #fff; margin-top: 30px;">Step 3: Download Your Transparent PNG</h3>
    <p>The AI will process the image securely entirely within your browser in seconds. Once you see the "Before & After" preview, click the "Download PNG" button. That's it! No watermarks.</p>

    <div class="cta-box">
      <h2 style="border:none; margin:0 0 10px;">Ready to try it yourself?</h2>
      <p>Click the button below to edit your photo for free.</p>
      <a href="../tools/background-remover.html" class="btn btn-blue" style="display:inline-block; margin-top:10px; padding:16px 32px; font-size:1.1rem; font-weight:bold; border-radius:100px;">🚀 Launch Free Background Remover</a>
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(blogsDir, 'how-to-remove-background-from-image.html'), blogHtml, 'utf8');

console.log(`✅ Internal linking updated in ${updatedCount} tools.`);
console.log('✅ Blog created at public/blog/how-to-remove-background-from-image.html');
