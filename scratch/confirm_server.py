import paramiko
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

def check_server_git():
    # 1. Local HEAD commit
    local_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    local_log = subprocess.check_output(['git', 'log', '-1', '--oneline'], text=True).strip()

    print("=== LOCAL GIT REPOSITORY ===")
    print("Local HEAD commit:", local_commit)
    print("Local latest log:", local_log)
    print()

    # 2. VPS Server HEAD commit & status
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """
    cd /root/MovieZone && \
    git fetch origin main && \
    echo "=== VPS REPOSITORY STATUS ===" && \
    git status && \
    echo "=== VPS LATEST COMMIT ===" && \
    git log -1 --oneline
    """

    stdin, stdout, stderr = client.exec_command(cmd)
    server_output = stdout.read().decode('utf-8', errors='ignore')
    print(server_output)

    client.close()

if __name__ == '__main__':
    check_server_git()
