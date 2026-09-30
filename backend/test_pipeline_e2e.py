import urllib.request
import json

# 1. Login with demo account
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/login',
    data=json.dumps({'email': 'demo@parivartan.ai', 'password': 'demo123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read().decode())['access_token']
print("Authenticated successfully! Token acquired.")

# 2. Get results
req3 = urllib.request.Request(
    'http://127.0.0.1:8000/api/pipeline/1/results',
    headers={'Authorization': f'Bearer {token}'}
)
res3 = urllib.request.urlopen(req3)
result_data = json.loads(res3.read().decode())

print("\n--- EXECUTIVE SUMMARY ---")
print(result_data.get('summary', '')[:280] + "...")

print("\n--- VERIFIED CITATIONS ---")
for c in result_data.get('citations', []):
    print(f"[{c['index']}] ({c['location']}) - Confidence: {int(c['confidence']*100)}% -> \"{c['source_quote']}\"")

print("\n--- QUESTION & ANSWER MATRIX ---")
for qa in result_data.get('qa_pairs', []):
    print(f"Q: {qa['question']}")
    print(f"A: {qa['answer']}\n")

# 3. Test Markdown export
req_md = urllib.request.Request(
    'http://127.0.0.1:8000/api/export/1/markdown',
    headers={'Authorization': f'Bearer {token}'}
)
md_out = urllib.request.urlopen(req_md).read().decode('utf-8')
print(f"Markdown Export OK: {len(md_out)} characters")

# 4. Test HTML export
req_html = urllib.request.Request(
    'http://127.0.0.1:8000/api/export/1/html',
    headers={'Authorization': f'Bearer {token}'}
)
html_out = urllib.request.urlopen(req_html).read().decode('utf-8')
print(f"HTML Export OK: {len(html_out)} characters")

# 5. Test Word DOCX export
req_docx = urllib.request.Request(
    'http://127.0.0.1:8000/api/export/1/docx',
    headers={'Authorization': f'Bearer {token}'}
)
docx_bytes = urllib.request.urlopen(req_docx).read()
print(f"DOCX Export OK: {len(docx_bytes)} bytes")

# 6. Test JSON export
req_json = urllib.request.Request(
    'http://127.0.0.1:8000/api/export/1/json',
    headers={'Authorization': f'Bearer {token}'}
)
json_out = urllib.request.urlopen(req_json).read().decode('utf-8')
print(f"JSON Export OK: {len(json_out)} characters")
