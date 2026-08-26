import os
import glob

def fix_mojibake(text):
    try:
        # The text was read as cp1252 and saved as utf-8. 
        # To reverse it, we encode to cp1252 and decode to utf-8.
        return text.encode('cp1252').decode('utf-8')
    except Exception as e:
        # If it fails, return the original text
        return text

base_dir = r"d:\AI tools Website\public"
html_files = glob.glob(os.path.join(base_dir, "**", "*.html"), recursive=True)

for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We only want to fix if there is actual mojibake like 'ðŸ'
        if 'ðŸ' in content or 'â€' in content or 'Â' in content:
            fixed_content = fix_mojibake(content)
            if fixed_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"Fixed emojis in {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print("Emoji fix complete.")
