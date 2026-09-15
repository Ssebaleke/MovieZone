import paramiko

def deploy_moviezone():
    print("Connecting to VPS 69.164.245.17...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    cmd = """
    cd /root/MovieZone && \
    echo "=== CURRENT DIRECTORY ===" && pwd && \
    echo "=== FETCHING LATEST GIT COMMITS ===" && \
    git fetch origin main && \
    git reset --hard origin/main && \
    echo "=== LATEST GIT LOG ===" && \
    git log -n 1 --oneline && \
    echo "=== REBUILDING FRONTEND DOCKER CONTAINER ===" && \
    docker-compose build frontend && \
    echo "=== RESTARTING FRONTEND SERVICE ===" && \
    docker-compose up -d --no-deps frontend && \
    echo "=== CONTAINER STATUS ===" && \
    docker ps | grep moviezone
    """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')

    print("=== STDOUT ===")
    print(out)
    print("=== STDERR ===")
    print(err)

    ssh.close()

if __name__ == '__main__':
    deploy_moviezone()
