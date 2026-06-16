import os
import glob

# Paths
base_dir = "c:/Users/Lizard Squad/AI tools Website"
html_files = glob.glob(os.path.join(base_dir, "public", "tools", "*.html"))
html_files.append(os.path.join(base_dir, "public", "index.html"))

# Exclude the 3 new tools
exclude = ["phishing-scanner.html", "pdf-to-link.html", "images-to-pdf.html"]
html_files = [f for f in html_files if not any(x in f for x in exclude)]

# Dictionary of replacements
replacements = {
    "🎨 PixelCraft AI": "PixelCraft AI",
    "✨ 10+ Professional AI Tools": "10+ Professional AI Tools",
    "🪄</h1>": "</h1>",
    "🚀 Log Out": "Log Out",
    "👋 Welcome back!": "Welcome back!",
    "🔒 100% Secure": "100% Secure",
    "⚡ Instant Processing": "Instant Processing",
    "💸 Free Forever": "Free Forever",
    "Try Tools For Free 🚀": "Try Tools For Free",
    "🎨 Filters &amp; Effects": "Filters &amp; Effects",
    "🎨 Filters & Effects": "Filters & Effects",
    "🖊️ Watermark Adder": "Watermark Adder",
    "📋 EXIF Data Viewer": "EXIF Data Viewer",
    "🎨 Color Palette Extractor": "Color Palette Extractor",
    "🔲 Custom QR Generator": "Custom QR Generator",
    "🗜️ Image Compressor": "Image Compressor",
    "🔄 Format Converter": "Format Converter",
    "📐 Smart Social Resize": "Smart Social Resize",
    "🕵️‍♂️ Deep AI Content Detector": "Deep AI Content Detector",
    "✍️ AI Text Humanizer": "AI Text Humanizer",
    "⬇️ Download": "Download",
    "🔄 Choose Output Format": "Choose Output Format",
    "🔄 New Image": "New Image",
    "🖼️": "",
    "📸": "",
    "🌐": "",
    "⚡": "",
    "✅": "",
    "⚠️": "",
    "⚙️": "",
    "📂": "",
    "🗑️": "",
    "✨ New": "New",
    "🌟 New": "New",
    "🔥 Popular": "Popular",
    "🔥 Premium": "Premium",
    "🚀 Trending": "Trending",
    "🔥 Magic": "Magic",
    "⏳ Upcoming": "Upcoming",
    "Made by 💗": "Made by",
    "🎨": "",
    "👉": "",
    "💯": "",
    "🔐": "",
    "✨": "",
}

# The user explicitly said: "teen naye tool ko alawa baki tools ko open karne ke baad bhi chote chote emojis he har text ke pahle to wo sab chote chote emojis hatao aur home page pe bhi chote emokjis he use hatl profeecinal tool ke pahele log out pe hand jka emoji ye sab hatao"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split to protect `<div class="tool-icon ...">...</div>`
    # We will temporarily replace them with placeholders
    import re
    placeholders = {}
    
    def placeholder_replacer(match):
        uid = f"__TOOL_ICON_{len(placeholders)}__"
        placeholders[uid] = match.group(0)
        return uid

    content = re.sub(r'<div class="tool-icon[^>]*>.*?</div>', placeholder_replacer, content)

    # Also protect <title> tags just in case
    def title_replacer(match):
        uid = f"__TITLE_{len(placeholders)}__"
        placeholders[uid] = match.group(0)
        return uid
        
    content = re.sub(r'<title>.*?</title>', title_replacer, content, flags=re.IGNORECASE|re.DOTALL)

    # Do the replacements
    for k, v in replacements.items():
        content = content.replace(k, v)

    # Now we can also run a general emoji stripper for remaining emojis in the text body?
    # Actually just replacing the known ones is safest.
    # Let's add a few more general replacements based on the prompt.
    content = content.replace("  PixelCraft AI", " PixelCraft AI")

    # Restore placeholders
    for uid, orig in placeholders.items():
        content = content.replace(uid, orig)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for file in html_files:
    process_file(file)

print("Files updated successfully.")
