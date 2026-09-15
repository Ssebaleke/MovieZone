import urllib.request
import json
import ssl

ctx = ssl.create_default_context()

payload = json.dumps({
    "email": "admin@vjpulse.site",
    "password": "Vico@2026"
}).encode('utf-8')

req = urllib.request.Request("https://vjpulse.site/api/auth/login", data=payload, headers={'Content-Type': 'application/json'}, method='POST')

try:
    res = urllib.request.urlopen(req, context=ctx)
    data = json.loads(res.read().decode())
    print("LOGIN SUCCESS!")
    print("USER EMAIL:", data['user']['email'])
    print("USER ROLE:", data['user']['role'])
    print("TOKEN GENERATED:", data['token'][:25] + "...")
except Exception as e:
    print("LOGIN FAILED:", e)
