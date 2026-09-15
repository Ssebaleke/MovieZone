import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_livepay_payloads():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = """docker exec moviezone_backend node -e "
    import('./db.js').then(async m => {
      const apiKey = 'c592698b45c893b3.29fa62e2c67544bc0d10d231974cb1fc76e2f35d4186f0e3825232795aef8030';
      const accountNumber = 'LP2609150953';

      console.log('Testing GET https://livepay.me/api/check-balance?accountNumber=' + accountNumber);
      const res1 = await fetch('https://livepay.me/api/check-balance?accountNumber=' + accountNumber, {
        headers: { 'Authorization': 'Bearer ' + apiKey }
      });
      console.log('Res 1 Status:', res1.status, await res1.text());

      console.log('\\nTesting POST https://livepay.me/api/check-balance with JSON body...');
      const res2 = await fetch('https://livepay.me/api/check-balance', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber })
      });
      console.log('Res 2 Status:', res2.status, await res2.text());

      process.exit(0);
    }).catch(err => { console.error(err); process.exit(1); });
    " """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:\n", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    test_livepay_payloads()
