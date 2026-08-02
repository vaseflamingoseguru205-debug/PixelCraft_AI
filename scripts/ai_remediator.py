import json
import os
import requests
import subprocess
import sys

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def log_debug(msg):
    print(msg)
    with open("ai_debug.log", "a") as f:
        f.write(msg + "\n")

def read_trivy_report():
    try:
        with open('trivy-results.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        log_debug("No Trivy report found.")
        return None

def extract_vulnerabilities(report):
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
    return "\n".join(set(vuln_summary))

def ask_gemini_for_fix(vuln_details):
    if not vuln_details:
        log_debug("No fixable vulnerabilities found.")
        return None
        
    log_debug("Sending to Gemini:\n" + vuln_details)
    
    prompt = f"""You are a DevSecOps Expert. Read this list of vulnerabilities.
Your ONLY job is to provide the exact terminal commands to update the vulnerable packages to their 'Fixed in' versions.
RULES:
1. ONLY output raw 'npm install package@version --save --legacy-peer-deps' commands.
2. NO markdown, NO backticks, NO explanations.
3. Put each command on a new line.

Vulnerabilities:
{vuln_details}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        log_debug("Gemini Response:\n" + res_text)
        return res_text
    except Exception as e:
        log_debug(f"Gemini API Error: {e}")
        return None

def apply_ai_fix(commands_text):
    if not commands_text:
        return
        
    commands = commands_text.strip().split('\n')
    success_count = 0
    
    for cmd in commands:
        cmd = cmd.strip().replace("`", "")
        if cmd.startswith("npm "):
            log_debug(f"Running Command: {cmd}")
            try:
                result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
                log_debug(f"Success! Output:\n{result.stdout}")
                success_count += 1
            except subprocess.CalledProcessError as e:
                log_debug(f"Failed! Output:\n{e.stderr}")
                sys.exit(1)
        elif cmd:
             log_debug(f"Ignored non-npm command: {cmd}")
             
    if success_count == 0:
        log_debug("No valid npm commands were executed!")
        sys.exit(1)

if __name__ == "__main__":
    trivy_data = read_trivy_report()
    if trivy_data:
        vuln_details = extract_vulnerabilities(trivy_data)
        ai_solution = ask_gemini_for_fix(vuln_details)
        if ai_solution:
            apply_ai_fix(ai_solution)