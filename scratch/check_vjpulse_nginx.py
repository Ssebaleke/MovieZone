import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_nginx_conf():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = "cat /etc/nginx/sites-enabled/vjpulse.site.conf"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("=== NGINX CONFIG ===")
    print(stdout.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    check_nginx_conf()
