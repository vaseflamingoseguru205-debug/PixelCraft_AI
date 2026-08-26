import os
import glob

base_dir = r"d:\AI tools Website\public"
html_files = glob.glob(os.path.join(base_dir, "**", "*.html"), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<meta charset="UTF-8">' not in content and '<meta charset="utf-8">' not in content:
        # Find <head> and insert right after it
        if '<head>' in content:
            new_content = content.replace('<head>', '<head>\n  <meta charset="UTF-8">', 1)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Added charset to {os.path.basename(filepath)}")
        elif '<head ' in content: # in case of attributes in head
            parts = content.split('<head', 1)
            post_head = parts[1].split('>', 1)
            new_content = parts[0] + '<head' + post_head[0] + '>\n  <meta charset="UTF-8">' + post_head[1]
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Added charset to {os.path.basename(filepath)}")
