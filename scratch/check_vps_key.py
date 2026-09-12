import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('69.164.245.17', username='root', password='Vico@2026')

cmd = """docker exec moviezone_backend node -e "fetch('https://api.reelplexi.com/v1/movies?per_page=10', { headers: { 'Authorization': 'Bearer sk_sandbox_a97391fcd4aec324269e7f5a26823b07', 'X-API-Key': 'sk_sandbox_a97391fcd4aec324269e7f5a26823b07' } }).then(async r => { console.log('VPS Status:', r.status); console.log('VPS Body:', await r.text()); process.exit(0); })" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print('STDOUT:', stdout.read().decode('utf-8', errors='ignore'))
print('STDERR:', stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
