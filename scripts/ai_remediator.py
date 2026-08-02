import json
import os
import requests
import subprocess
import re

# Fetch Gemini API key from GitHub Secrets
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def read_trivy_report():
    try:
        with open('trivy-results.json', 'r') as file:
            report = json.load(file)
            return report
    except FileNotFoundError:
        print("No Trivy report found. Everything looks secure!")
        return None

def ask_gemini_for_fix(report):
    print("Sending vulnerability data to Gemini AI...")
    
    # Truncate the report to prevent exceeding API token limits
    bug_details = str(report)[:1500] 
    
    # STRICT PROMPT to ensure we only get valid npm install commands
    prompt = f"""You are a DevSecOps Expert. Read this Trivy vulnerability report.
Your ONLY job is to provide the exact terminal commands needed to fix these vulnerabilities in a Node.js project.
RULES:
1. ONLY output raw 'npm install package@version --save' commands.
2. NO markdown formatting, NO backticks (```), NO explanations.
3. Put each command on a new line.
4. Do NOT include 'npm audit fix' as it is unreliable for specific versions.

Report:
{bug_details}"""

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
    
    for cmd in commands:
        cmd = cmd.strip()
        # Clean up any accidental markdown or backticks the AI might have still included
        cmd = cmd.replace("`", "")
        if cmd.startswith("npm install"):
            print(f"Running Command: {cmd}")
            try:
                # Command ko terminal mein execute karna
                subprocess.run(cmd, shell=True, check=True)
                print("✅ Success!")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to execute. Error: {e}")
        elif cmd:
             print(f"⚠️ Ignored non-npm command: {cmd}")

if __name__ == "__main__":
    # Execute the workflow
    trivy_data = read_trivy_report()
    if trivy_data:
        ai_solution = ask_gemini_for_fix(trivy_data)
        
        print("\n--- GEMINI AI SUGGESTED COMMANDS ---\n")
        print(ai_solution)
        
        # Apply fixes
        apply_ai_fix(ai_solution)