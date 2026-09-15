import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def push_prisma():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    cmd = """
    docker exec moviezone_backend npx prisma db push && \
    docker exec moviezone_backend npx prisma generate
    """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:\n", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    push_prisma()
