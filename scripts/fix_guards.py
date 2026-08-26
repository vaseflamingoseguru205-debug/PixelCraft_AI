import os
import glob
import re

base_dir = r"d:\AI tools Website\public"

# 1. Remove login guard from non-tool pages
non_tool_files = glob.glob(os.path.join(base_dir, "*.html"))
for filepath in non_tool_files:
    if "login.html" in filepath:
        continue # skip login.html just in case
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use regex to remove the login guard script block
    new_content = re.sub(r'<!-- Global Login Guard -->\s*<script>\s*if \(localStorage\.getItem\(\'isLoggedIn\'\) !== \'true\'\) \{.*?</script>', '', content, flags=re.DOTALL)
    
    # Fix the strict disclaimer logic: remove `|| e.target.closest('a')`
    new_content = new_content.replace(
        "if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type=\"submit\"]')) {",
        "if (e.target.closest('button') || e.target.closest('input[type=\"submit\"]')) {"
    )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {os.path.basename(filepath)}")

# 2. Fix the strict disclaimer logic in tool pages too
tool_files = glob.glob(os.path.join(base_dir, "tools", "*.html"))
for filepath in tool_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace(
        "if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type=\"submit\"]')) {",
        "if (e.target.closest('button') || e.target.closest('input[type=\"submit\"]')) {"
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {os.path.basename(filepath)}")

print("Done fixing guards and interceptors.")
