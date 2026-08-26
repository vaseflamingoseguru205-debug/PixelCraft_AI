import os
import glob

# Paths
base_dir = r"d:\AI tools Website\public"
html_files = glob.glob(os.path.join(base_dir, "tools", "*.html"))
html_files.append(os.path.join(base_dir, "index.html"))

toggle_btn_html = """
      <li class="theme-toggle-container">
        <button id="theme-toggle" class="theme-toggle-btn">
          <span id="theme-icon">🌙</span> Dark
        </button>
      </li>
"""

popup_html = """
  <!-- Strict Disclaimer Popup -->
  <div id="strict-disclaimer" class="strict-disclaimer-popup">
    <div class="strict-disclaimer-text">
      ⚠️ <strong>SECURITY NOTICE:</strong> You are strictly responsible for any misuse of this tool. We collect basic telemetry data for security purposes. No files are uploaded. 
      <br>By continuing, you agree to our <a href="/terms-conditions.html">Terms & Conditions</a> and <a href="/privacy-policy.html">Privacy Policy</a>.
    </div>
    <button id="accept-disclaimer" class="strict-disclaimer-close">I Accept & Understand</button>
  </div>

  <script>
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    function setTheme(isDark) {
      if (isDark) {
        document.body.classList.add('dark-mode');
        if(themeIcon) themeIcon.textContent = '☀️';
        if(themeToggleBtn) themeToggleBtn.innerHTML = '<span id="theme-icon">☀️</span> Light';
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        if(themeIcon) themeIcon.textContent = '🌙';
        if(themeToggleBtn) themeToggleBtn.innerHTML = '<span id="theme-icon">🌙</span> Dark';
        localStorage.setItem('theme', 'light');
      }
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-mode');
        setTheme(isDark);
      });
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme(true);
    } else {
      // Default is light
      setTheme(false);
    }

    // Strict Disclaimer Logic
    const disclaimerPopup = document.getElementById('strict-disclaimer');
    const acceptBtn = document.getElementById('accept-disclaimer');
    
    if (disclaimerPopup && acceptBtn) {
      const isAccepted = localStorage.getItem('strict_disclaimer_accepted');
      if (!isAccepted) {
        setTimeout(() => {
          disclaimerPopup.classList.add('active');
        }, 1000);
      }

      acceptBtn.addEventListener('click', () => {
        disclaimerPopup.classList.remove('active');
        localStorage.setItem('strict_disclaimer_accepted', 'true');
      });
    }
  </script>
"""

for filepath in html_files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Footer links from privacy.html -> privacy-policy.html
    content = content.replace('"privacy.html"', '"/privacy-policy.html"')
    content = content.replace('"terms.html"', '"/terms-conditions.html"')
    content = content.replace('"../privacy.html"', '"/privacy-policy.html"')
    content = content.replace('"../terms.html"', '"/terms-conditions.html"')
    
    # Check if we already injected
    if 'id="theme-toggle"' not in content:
        # Inject Theme Toggle into navbar
        # Find </ul> of navbar
        parts = content.split('</ul>', 1)
        if len(parts) == 2 and '<nav' in parts[0]:
            content = parts[0] + toggle_btn_html + '</ul>' + parts[1]

    if 'id="strict-disclaimer"' not in content:
        # Inject Disclaimer and script before </body>
        parts = content.split('</body>', 1)
        if len(parts) == 2:
            content = parts[0] + popup_html + '\n</body>' + parts[1]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Successfully processed {len(html_files)} files.")
