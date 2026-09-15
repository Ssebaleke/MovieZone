import urllib.request
import json
import ssl

ctx = ssl.create_default_context()

# 1. Login as Admin
login_payload = json.dumps({"email": "admin@vjpulse.site", "password": "Vico@2026"}).encode('utf-8')
login_req = urllib.request.Request("https://vjpulse.site/api/auth/login", data=login_payload, headers={'Content-Type': 'application/json'}, method='POST')

try:
    login_res = urllib.request.urlopen(login_req, context=ctx)
    token = json.loads(login_res.read().decode())['token']
    print("LOGGED IN! Token received.")

    # 2. Post package creation
    pkg_payload = json.dumps({
        "name": "Daily Pass Test",
        "price": 2000,
        "currency": "UGX",
        "interval": "1_DAYS",
        "description": "24 Hours Day Pass",
        "features": "Unlimited Streaming, 1 Screen, HD Quality",
        "resolution": "1080p Full HD",
        "screens": 1,
        "isActive": True
    }).encode('utf-8')

    pkg_req = urllib.request.Request("https://vjpulse.site/api/admin/packages", data=pkg_payload, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }, method='POST')

    pkg_res = urllib.request.urlopen(pkg_req, context=ctx)
    pkg_data = json.loads(pkg_res.read().decode())
    print("PACKAGE CREATION SUCCESSFUL!")
    print(pkg_data)
except Exception as e:
    print("ERROR:", e)
