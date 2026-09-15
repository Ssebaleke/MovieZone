import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_livepay():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """docker exec moviezone_backend node -e "import('./db.js').then(async m => { console.log(await m.default.systemSetting.findMany({ where: { key: { in: ['LIVEPAY_API_KEY', 'LIVEPAY_ACCOUNT_NUMBER', 'LIVEPAY_ENABLED'] } } })); process.exit(0); })" """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("=== LIVEPAY SYSTEM SETTINGS IN DB ===")
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    test_livepay()
