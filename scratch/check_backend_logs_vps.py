import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('69.164.245.17', username='root', password='Vico@2026Password!')

stdin, stdout, stderr = ssh.exec_command('docker logs moviezone_backend --tail 100')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

with open('scratch/vps_backend.log', 'w', encoding='utf-8') as f:
    f.write("=== STDOUT ===\n" + out + "\n=== STDERR ===\n" + err)

print("Logs written to scratch/vps_backend.log")
ssh.close()
