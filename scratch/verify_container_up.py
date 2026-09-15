import paramiko

def verify():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """
    cd /root/MovieZone && \
    echo "=== REPO COMMIT ===" && \
    git log -n 1 --oneline && \
    echo "=== RUNNING CONTAINERS ===" && \
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep moviezone
    """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()

if __name__ == '__main__':
    verify()
