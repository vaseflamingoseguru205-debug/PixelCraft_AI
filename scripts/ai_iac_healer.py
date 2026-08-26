import os
from google import genai

def read_dockerfile():
    try:
        with open("Dockerfile", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print("[-] Dockerfile not found.")
        return None

def write_dockerfile(content):
    try:
        with open("Dockerfile", "w", encoding="utf-8") as f:
            f.write(content)
        print("[+] Dockerfile successfully auto-healed and rewritten.")
    except Exception as e:
        print(f"[-] Failed to write Dockerfile: {e}")

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[-] Error: GEMINI_API_KEY not found. Skipping IaC Healing.")
        return

    print("[*] Reading Dockerfile for security vulnerabilities...")
    dockerfile_content = read_dockerfile()
    if not dockerfile_content:
        return

    prompt = f"""
    You are an Elite DevSecOps Architect and a Kubernetes/Docker Security Expert.
    Your system is called the "Auto-Healing Infrastructure Agent".
    
    The following is a Dockerfile from a Node.js project. It contains severe security misconfigurations.
    
    ```dockerfile
    {dockerfile_content}
    ```
    
    Task: Fix all security vulnerabilities in this Dockerfile and return the COMPLETE, FIXED Dockerfile.
    Apply these best practices:
    - Use a slim or alpine base image instead of `latest`.
    - Never run as root. Create a non-root user (e.g., `node`) and switch to it using `USER node`.
    - Expose a non-privileged port (e.g., 3000) instead of 80.
    - Implement proper caching for `npm install` by copying `package.json` first, and use `npm ci` if possible.
    
    IMPORTANT: Output ONLY the raw content of the fixed Dockerfile. Do not include markdown formatting like ```dockerfile or explanations. I need to write your exact output directly into the file.
    """

    print("[*] Engaging Gemini 3.5 Flash to generate Secure Dockerfile...")
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        
        # Clean the output in case Gemini added markdown blocks
        fixed_dockerfile = response.text.strip()
        if fixed_dockerfile.startswith("```dockerfile"):
            fixed_dockerfile = fixed_dockerfile[13:]
        elif fixed_dockerfile.startswith("```"):
            fixed_dockerfile = fixed_dockerfile[3:]
        
        if fixed_dockerfile.endswith("```"):
            fixed_dockerfile = fixed_dockerfile[:-3]
            
        fixed_dockerfile = fixed_dockerfile.strip()
        
        # Only rewrite if Gemini actually returned something
        if len(fixed_dockerfile) > 10:
            write_dockerfile(fixed_dockerfile)
        else:
            print("[-] AI returned an empty response.")
            
    except Exception as e:
        print(f"[-] AI Generation failed: {e}")

if __name__ == "__main__":
    main()
