import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("69.164.245.17", username="root", password="Vico@2026", timeout=20)

cmd = """docker exec moviezone_backend node -e "import('./db.js').then(async m => { console.log(await m.default.user.findMany({ select: { id: true, email: true, role: true, plan: true, subscriptionStatus: true } })); process.exit(0); })" """
stdin, stdout, stderr = client.exec_command(cmd)
print("VPS Users:")
print(stdout.read().decode())
client.close()
