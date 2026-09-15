import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_vps():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """
    echo "=== LISTENING PORTS ==="
    ss -tulpn
    echo "=== DOCKER CONTAINERS ==="
    docker ps
    echo "=== NGINX STATUS ==="
    nginx -v || echo "Nginx binary check"
    echo "=== CERTBOT STATUS ==="
    certbot --version || echo "Certbot check"
    """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    inspect_vps()
