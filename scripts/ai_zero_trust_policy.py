import os
import json
from google import genai

def analyze_dependencies():
    """Reads package.json to identify cloud service requirements."""
    try:
        with open("package.json", "r", encoding="utf-8") as f:
            package_data = json.load(f)
            deps = package_data.get("dependencies", {})
            dev_deps = package_data.get("devDependencies", {})
            all_deps = {**deps, **dev_deps}
            return json.dumps(all_deps, indent=2)
    except Exception as e:
        return "No package.json found or invalid JSON."

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[-] Error: GEMINI_API_KEY not found. Skipping Zero-Trust IAM generation.")
        return

    print("[*] Reading project dependencies to infer Cloud Architecture...")
    dependencies = analyze_dependencies()
    
    prompt = f"""
    You are an Elite Cloud Security Architect. Your goal is to enforce "Zero-Trust" and "Least Privilege".
    
    Analyze the following Node.js dependencies found in the project's package.json:
    {dependencies}
    
    Based on these dependencies, infer what AWS services this application needs access to.
    For example:
    - If it uses 'mongoose' or 'mongodb', it might need access to Amazon DocumentDB or EC2.
    - If it uses 'multer', it almost certainly uploads files to Amazon S3 (needs s3:PutObject).
    - If it uses 'nodemailer', it probably sends emails via Amazon SES (needs ses:SendEmail).
    - If it uses 'dotenv', it should ideally fetch secrets from AWS Secrets Manager (needs secretsmanager:GetSecretValue).
    
    Task: Generate a strictly scoped, production-ready AWS IAM Policy in valid JSON format.
    Do NOT use wildcard '*' for resources if possible (use placeholder ARNs like 'arn:aws:s3:::my-app-bucket/*').
    
    IMPORTANT: Output ONLY the raw JSON policy. Do not include markdown formatting (like ```json), explanations, or conversational text. Just the raw JSON object.
    """

    print("[*] Engaging Gemini 3.5 Flash to generate Zero-Trust IAM Policy...")
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        
        # Clean the output in case Gemini added markdown blocks
        policy_json = response.text.strip()
        if policy_json.startswith("```json"):
            policy_json = policy_json[7:]
        if policy_json.startswith("```"):
            policy_json = policy_json[3:]
        if policy_json.endswith("```"):
            policy_json = policy_json[:-3]
        policy_json = policy_json.strip()
        
        # Save to file
        with open("zero-trust-iam-policy.json", "w", encoding="utf-8") as f:
            f.write(policy_json)
            
        print("[+] Zero-Trust IAM Policy generated successfully: zero-trust-iam-policy.json")
    except Exception as e:
        print(f"[-] AI Generation failed: {e}")

if __name__ == "__main__":
    main()
