import os, re
d = 'public'
for f in os.listdir(d):
    if f.endswith('.html'):
        p = os.path.join(d, f)
        with open(p, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace existing versioned logos like logo.jpg?v=3 with logo.jpg?v=4
        content = re.sub(r'logo\.jpg\?v=\d+', 'logo.jpg?v=4', content)
        
        # Replace non-versioned logos like logo.jpg with logo.jpg?v=4
        content = re.sub(r'logo\.jpg([\"\'\)])', r'logo.jpg?v=4\1', content)
        
        with open(p, 'w', encoding='utf-8') as file:
            file.write(content)
print('Done!')
