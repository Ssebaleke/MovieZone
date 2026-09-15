import paramiko

def deploy():
    print("Connecting to VPS 69.164.245.17...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    # Command to find project directory and perform git pull & docker build
    cmd = """
    cd $(find /root /home /var /opt /srv -name "docker-compose.yml" 2>/dev/null | head -n 1 | xargs dirname) && \
    echo "Current directory: $(pwd)" && \
    git status && \
    git fetch origin main && \
    git reset --hard origin/main && \
    docker compose build frontend || docker-compose build frontend && \
    docker compose up -d || docker-compose up -d
    """

    print("Executing deployment commands on VPS...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    print("=== STDOUT ===")
    print(out)
    print("=== STDERR ===")
    print(err)
    
    ssh.close()
    print("Deployment script finished.")

if __name__ == '__main__':
    deploy()
