import os
import glob
import re

base_dir = "c:/Users/Lizard Squad/AI tools Website"
html_files = glob.glob(os.path.join(base_dir, "public", "tools", "*.html"))
html_files.append(os.path.join(base_dir, "public", "index.html"))

exclude = ["phishing-scanner.html", "pdf-to-link.html", "images-to-pdf.html"]
html_files = [f for f in html_files if not any(x in f for x in exclude)]

emoji_pattern = re.compile(
    "["
    "\U0001f600-\U0001f64f"
    "\U0001f300-\U0001f5ff"
    "\U0001f680-\U0001f6ff"
    "\U0001f1e0-\U0001f1ff"
    "\u2702-\u27b0"
    "\u24c2-\U0001f251"
    "\U0001f900-\U0001f9ff"
    "\U0001fa70-\U0001faff"
    "\u2600-\u26ff"
    "\u2b00-\u2bff"
    "]+", flags=re.UNICODE)

extras = ["📝", "👁️", "🛡️", "🔍", "🕵️‍♂️", "✍️", "💬", "🔊", "🧊", "🎨", "🖊️", "📋", "🔲", "🗜️", "📐", "✅", "⚠️", "⚙️", "📥", "🔗", "📄", "📂", "✨", "🪄", "🚀", "🔒", "⚡", "💸", "👋", "🔄", "🖼️", "📸", "🌐", "⬇️", "🌟", "🔥", "❌", "🗑️", "⬇", "✔", "🪄"]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    placeholders = {}
    
    def placeholder_replacer(match):
        uid = f"__TOOL_ICON_{len(placeholders)}__"
        placeholders[uid] = match.group(0)
        return uid

    if "index.html" in filepath:
        content = re.sub(r'<div class="tool-icon[^>]*>.*?</div>', placeholder_replacer, content)

    content = emoji_pattern.sub('', content)

    for e in extras:
        content = content.replace(e, "")

    # Fix spacing issues that might happen like "> Text"
    content = content.replace("> ", ">")
    
    for uid, orig in placeholders.items():
        content = content.replace(uid, orig)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for file in html_files:
    process_file(file)

print("Emoji cleanup complete.")
