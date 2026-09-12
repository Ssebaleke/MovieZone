import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('69.164.245.17', username='root', password='Vico@2026')

cmd = """docker exec moviezone_backend node -e "import('./db.js').then(async m => { console.log(await m.default.systemSetting.findMany()); process.exit(0); })" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print('STDOUT:', stdout.read().decode('utf-8', errors='ignore'))
print('STDERR:', stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
