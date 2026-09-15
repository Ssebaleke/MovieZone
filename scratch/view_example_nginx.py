import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def view_nginx():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = "cat /etc/nginx/sites-enabled/kapapula.online"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    view_nginx()
