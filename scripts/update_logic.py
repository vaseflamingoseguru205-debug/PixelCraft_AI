import os
import glob

base_dir = r"d:\AI tools Website\public"
html_files = glob.glob(os.path.join(base_dir, "tools", "*.html"))
html_files.append(os.path.join(base_dir, "index.html"))
html_files.append(os.path.join(base_dir, "about.html"))
html_files.append(os.path.join(base_dir, "about-us.html"))
html_files.append(os.path.join(base_dir, "contact-us.html"))
html_files.append(os.path.join(base_dir, "terms.html"))
html_files.append(os.path.join(base_dir, "terms-conditions.html"))
html_files.append(os.path.join(base_dir, "disclaimer.html"))

# Ensure unique files
html_files = list(set([f for f in html_files if os.path.exists(f)]))

login_guard_script = """
  <!-- Global Login Guard -->
  <script>
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      window.location.href = '/login.html?returnTo=' + encodeURIComponent(window.location.pathname);
    }
  </script>
"""

new_disclaimer_script = """
  <script id="disclaimer-logic">
    // Strict Disclaimer Logic with Execution Blocker
    const disclaimerPopup = document.getElementById('strict-disclaimer');
    const acceptBtn = document.getElementById('accept-disclaimer');
    
    if (disclaimerPopup && acceptBtn) {
      const isAccepted = localStorage.getItem('strict_disclaimer_accepted');
      if (!isAccepted) {
        setTimeout(() => {
          disclaimerPopup.classList.add('active');
        }, 500);

        // Global Click Interceptor
        document.addEventListener('click', function(e) {
          // Allow clicks on the disclaimer popup itself, theme toggles, and nav links
          if (e.target.closest('#strict-disclaimer') || e.target.closest('.theme-toggle-btn') || e.target.closest('.nav-links') || e.target.closest('.navbar')) {
            return; 
          }

          // If it's a button or link (like a tool execution button)
          if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type="submit"]')) {
            if (!localStorage.getItem('strict_disclaimer_accepted')) {
              e.preventDefault();
              e.stopPropagation();
              
              // Shake and glow effect
              disclaimerPopup.style.transform = 'translateY(0) scale(1.05)';
              disclaimerPopup.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.8)';
              setTimeout(() => {
                disclaimerPopup.style.transform = 'translateY(0) scale(1)';
                disclaimerPopup.style.boxShadow = '0 -10px 40px rgba(0,0,0,0.5)';
              }, 300);
            }
          }
        }, true); // Use capture phase to intercept before tool scripts
      }

      acceptBtn.addEventListener('click', () => {
        disclaimerPopup.classList.remove('active');
        localStorage.setItem('strict_disclaimer_accepted', 'true');
      });
    }
  </script>
"""

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Revert privacy links
    content = content.replace('"/privacy-policy.html"', '"/privacy.html"')
    content = content.replace('"privacy-policy.html"', '"privacy.html"')
    content = content.replace('"../privacy-policy.html"', '"../privacy.html"')

    # 2. Inject Login Guard right after <head>
    if '<!-- Global Login Guard -->' not in content:
        parts = content.split('<head>', 1)
        if len(parts) == 2:
            content = parts[0] + '<head>\n' + login_guard_script + parts[1]

    # 3. Replace old disclaimer script with new strict interceptor script
    if '<script id="disclaimer-logic">' not in content:
        # The previous script might not have had an ID, so let's find the acceptBtn listener and replace that whole block.
        # But this is tricky. Let's just find the start of "// Strict Disclaimer Logic" and the end of that script block.
        start_idx = content.find('// Strict Disclaimer Logic')
        if start_idx != -1:
            # find the <script> tag before it
            script_start = content.rfind('<script>', 0, start_idx)
            script_end = content.find('</script>', start_idx)
            if script_start != -1 and script_end != -1:
                content = content[:script_start] + new_disclaimer_script + content[script_end + len('</script>'):]
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Delete privacy-policy.html
policy_path = os.path.join(base_dir, 'privacy-policy.html')
if os.path.exists(policy_path):
    os.remove(policy_path)
    
print("Updated all files successfully.")
