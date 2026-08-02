import json
import os
import requests
import subprocess
import sys

# Fetch Gemini API key from GitHub Secrets
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def read_trivy_report():
    try:
        with open('trivy-results.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        print("No Trivy report found. Everything looks secure!")
        return None

def extract_vulnerabilities(report):
    # Extract only the relevant vulnerability info to save tokens
    vuln_summary = []
    
    if "Results" in report:
        for result in report["Results"]:
            if "Vulnerabilities" in result:
                for vuln in result["Vulnerabilities"]:
                    pkg = vuln.get("PkgName", "unknown")
                    installed = vuln.get("InstalledVersion", "unknown")
                    fixed = vuln.get("FixedVersion", "unknown")
                    severity = vuln.get("Severity", "unknown")
                    
                    if fixed != "unknown" and fixed != "":
                        vuln_summary.append(f"Package: {pkg}, Installed: {installed}, Fixed in: {fixed}, Severity: {severity}")
                    
    return "\n".join(set(vuln_summary)) # Remove duplicates

def ask_gemini_for_fix(vuln_details):
    if not vuln_details:
        print("No fixable vulnerabilities found to send to AI.")
        return None
        
    print("Sending vulnerability data to Gemini AI...")
    
    # STRICT PROMPT to ensure we only get valid npm install commands
    prompt = f"""You are a DevSecOps Expert. Read this list of vulnerabilities found in our Node.js project.
Your ONLY job is to provide the exact terminal commands needed to update these vulnerable packages to their fixed versions.
RULES:
1. ONLY output raw 'npm install package@version --save --legacy-peer-deps' commands.
2. NO markdown formatting, NO backticks (```), NO explanations.
3. Put each command on a new line.
4. Do NOT include 'npm audit fix'.

Vulnerabilities:
{vuln_details}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print("Gemini API Error:", e)
        return None

def apply_ai_fix(commands_text):
    if not commands_text:
        return
        
    print("\n--- APPLYING AI FIXES AUTOMATICALLY ---\n")
    commands = commands_text.strip().split('\n')
    
    success_count = 0
    for cmd in commands:
        cmd = cmd.strip()
        cmd = cmd.replace("`", "")
        if cmd.startswith("npm install"):
            print(f"Running Command: {cmd}")
            try:
                subprocess.run(cmd, shell=True, check=True)
                print("✅ Success!")
                success_count += 1
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to execute. Error: {e}")
                sys.exit(1)
        elif cmd:
             print(f"⚠️ Ignored non-npm command: {cmd}")
             
    if success_count == 0:
        print("❌ No valid npm commands were executed!")
        sys.exit(1)

if __name__ == "__main__":
    trivy_data = read_trivy_report()
    if trivy_data:
        vuln_details = extract_vulnerabilities(trivy_data)
        print("\n--- EXTRACTED VULNERABILITIES ---\n")
        print(vuln_details)
        
        ai_solution = ask_gemini_for_fix(vuln_details)
        
        if ai_solution:
            print("\n--- GEMINI AI SUGGESTED COMMANDS ---\n")
            print(ai_solution)
            
            # Apply fixes
            apply_ai_fix(ai_solution)
        else:
            print("No AI solution provided.")