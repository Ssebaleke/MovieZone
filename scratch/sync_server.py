import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def sync_server():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    cmd = """
    cd /root/MovieZone && \
    git fetch origin main && \
    git reset --hard origin/main && \
    docker-compose build && \
    docker-compose up -d --force-recreate && \
    echo "=== CURRENT VPS COMMIT ===" && \
    git log -1 --oneline
    """

    stdin, stdout, stderr = client.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    client.close()

if __name__ == '__main__':
    sync_server()
