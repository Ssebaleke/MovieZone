import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_nginx():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """
    ls -la /etc/nginx/sites-enabled/
    ls -la /etc/nginx/conf.d/
    """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    inspect_nginx()
