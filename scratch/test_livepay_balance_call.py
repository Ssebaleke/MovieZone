import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_livepay_balance():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """docker exec moviezone_backend node -e "
    import('./db.js').then(async m => {
      const apiKey = 'c592698b45c893b3.29fa62e2c67544bc0d10d231974cb1fc76e2f35d4186f0e3825232795aef8030';
      console.log('Calling https://livepay.me/api/check-balance ...');
      const res = await fetch('https://livepay.me/api/check-balance', {
        headers: { 'Authorization': 'Bearer ' + apiKey }
      });
      console.log('Status Code:', res.status);
      const data = await res.text();
      console.log('Response Body:', data);
      process.exit(0);
    }).catch(err => { console.error(err); process.exit(1); });
    " """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:\n", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    test_livepay_balance()
