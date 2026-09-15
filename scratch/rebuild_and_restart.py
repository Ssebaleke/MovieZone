import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def deploy_vico():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    cmd = """
    cd /root/MovieZone && \
    git fetch origin main && \
    git reset --hard origin/main && \
    docker-compose build frontend && \
    docker-compose up -d --force-recreate frontend
    """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    deploy_vico()
