import os
import glob

base_dir = r"d:\AI tools Website\public"
html_files = glob.glob(os.path.join(base_dir, "**", "*.html"), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        original_content = content

    # Replace SEO metadata texts
    content = content.replace("Free AI Image Editing Tools Online |  Compressor & More | Best Free AI Tool", "Free Cybersecurity Utility Tools Online | Steganography & More")
    content = content.replace("Free AI Image Editing Tools Online |  Compressor & More", "Free Cybersecurity Utility Tools Online")
    content = content.replace("free professional AI tools - compress images, add watermarks, convert formats, colorize photos and more.", "free professional AI tools - detect phishing, hide secret messages, scrub metadata, and protect your digital privacy.")
    content = content.replace("free professional AI image tools -  compress images, add watermarks, convert formats, colorize photos and more.", "free professional AI tools - detect phishing, hide secret messages, scrub metadata, and protect your digital privacy.")
    content = content.replace("AI image processing instantly for free", "AI security utilities instantly for free")
    content = content.replace("free AI image editing toolkit. Edit, enhance, remove backgrounds, compress, and colorize images", "free AI cybersecurity utility toolkit. Protect privacy, scrub metadata, and use advanced steganography")

    # If it's index.html, remove the broken popup blob at the end
    if os.path.basename(filepath) == 'index.html':
        idx = content.find('<!-- Cyber Security Loading Animation -->')
        if idx != -1:
            # We cut off right before the broken part and add the closing tags
            content = content[:idx] + '</body>\n</html>\n'

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated metadata in {os.path.basename(filepath)}")

print("Done updating SEO and removing broken html.")
