import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def restart_frontend():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = "cd /root/MovieZone && docker-compose up -d --force-recreate frontend"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    restart_frontend()
