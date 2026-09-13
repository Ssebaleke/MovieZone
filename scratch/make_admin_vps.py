import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("69.164.245.17", username="root", password="Vico@2026", timeout=20)

cmd = """docker exec moviezone_backend node -e "import('./db.js').then(async m => { const updated = await m.default.user.updateMany({ where: { email: { in: ['jsvico100@gmail.com', 'ahmedmutumba@gmail.com'] } }, data: { role: 'ADMIN', plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' } }); console.log('Updated users to ADMIN:', updated); process.exit(0); })" """

stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
