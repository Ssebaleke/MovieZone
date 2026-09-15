import urllib.request
import ssl

ctx = ssl.create_default_context()

try:
    req = urllib.request.urlopen("https://vjpulse.site", context=ctx, timeout=10)
    print("STATUS CODE:", req.getcode())
    print("CONTENT HEAD:", req.read(200).decode('utf-8', errors='ignore'))
except Exception as e:
    print("ERROR:", e)
