import os
import re
import glob

index_path = r'd:\AI tools Website\public\index.html'
tools_dir = r'd:\AI tools Website\public\tools'

with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove massive SEO block
seo_start = html.find('<!-- SEO RICH CONTENT BLOCK -->')
if seo_start != -1:
    section_end = html.find('</section>', seo_start)
    if section_end != -1:
        html = html[:seo_start] + html[section_end + 10:]

# 2. Remove hidden tools block
hidden_start = html.find('<!-- NEW ADVANCED TOOLS (HIDDEN UNTIL BACKEND UPGRADE) -->')
if hidden_start != -1:
    hidden_end = html.find('<style>', hidden_start)
    if hidden_end != -1:
        html = html[:hidden_start] + html[hidden_end:]

# 3. Replace meta keywords
html = re.sub(r'<meta name="keywords"\s*content="[^"]+" />', '<meta name="keywords" content="image tools, free online, PixelCraft AI" />', html)

# 4. Remove '🔒 Requires Secret Key' blocks completely
html = re.sub(r'<div style="font-size: 0\.8rem; color: #ef4444; margin-bottom: 15px; font-weight: bold;">🔒 Requires Secret Key</div>\s*<button class="btn-secret">🔑 Get Secret Link</button>', '', html)

# 5. Remove any openAuthModal triggers
html = re.sub(r'onclick="openAuthModal\([^)]+\)"', '', html)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html)

# Now find linked tools
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

linked_tools = set(re.findall(r'href=["\']/tools/([^"\'#]+\.html)["\']', html))
linked_tools.update(re.findall(r'href=["\']tools/([^"\'#]+\.html)["\']', html))

print("Linked tools in index.html:", linked_tools)

# Find all HTML files in tools dir
all_tools = [os.path.basename(p) for p in glob.glob(os.path.join(tools_dir, '*.html'))]

unlinked_tools = set(all_tools) - linked_tools
print("Unlinked tools to delete:", unlinked_tools)

for tool in unlinked_tools:
    os.remove(os.path.join(tools_dir, tool))
    print("Deleted", tool)
