import os
import json
from google import genai
from google.genai import types

def analyze_codebase():
    """Reads all relevant source files for AI analysis."""
    code_context = ""
    # Try to find JS, HTML, Python files, excluding node_modules
    for root, dirs, files in os.walk("."):
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        if ".git" in dirs:
            dirs.remove(".git")
            
        for file in files:
            if file.endswith(('.js', '.html', '.py', 'package.json')) and not file.startswith('ai_'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                        # Truncate large files to save tokens
                        if len(content) > 5000:
                            content = content[:5000] + "\n...[TRUNCATED]..."
                        code_context += f"\\n--- FILE: {filepath} ---\\n{content}\\n"
                except Exception as e:
                    pass
    return code_context

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[-] Error: GEMINI_API_KEY not found. Skipping AI Red Teamer.")
        return

    print("[*] Gathering source code for AI Red Team Analysis...")
    code_context = analyze_codebase()
    
    if not code_context.strip():
        code_context = "No source files found. Analyze the project based on dependencies or assume it is an empty shell."

    prompt = f"""
    You are an elite AI Red Teamer, Ethical Hacker, and Penetration Tester.
    Your job is to perform Static Application Security Testing (SAST) and Threat Modeling on the provided codebase.
    
    Analyze the following project structure and files:
    {code_context}

    Generate a highly professional, aggressive but ethical 'AI Red Team & Threat Modeling Report' in Markdown.
    The report should include:
    1. 🎯 **Attack Surface Analysis:** What technologies are used (from package.json/files) and what are their common vulnerabilities.
    2. 💣 **Simulated Attack Vectors:** Specific attack scenarios (e.g., NoSQL Injection for Mongoose, XSS for Express/HTML). 
       - Provide EXACT malicious `curl` commands or script payloads a hacker would use to test these!
    3. 🛡️ **Zero-Trust & Mitigation:** How to secure the application against these attacks.
    
    Format the output cleanly in Markdown. Do not include any polite conversational filler. Just the report.
    """

    print("[*] Engaging Gemini 3.5 Flash for Threat Modeling...")
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        
        report_content = response.text
        
        # Save to file
        with open("ai-red-team-report.md", "w", encoding="utf-8") as f:
            f.write(report_content)
            
        print("[+] Red Team Report generated successfully: ai-red-team-report.md")
    except Exception as e:
        print(f"[-] AI Generation failed: {e}")

if __name__ == "__main__":
    main()
