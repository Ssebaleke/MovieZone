import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_livepay_whitelisted():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    node_script = """
    import prisma from './db.js';

    async function run() {
      const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: 'LIVEPAY_API_KEY' } });
      const accSetting = await prisma.systemSetting.findUnique({ where: { key: 'LIVEPAY_ACCOUNT_NUMBER' } });

      const apiKey = apiKeySetting ? apiKeySetting.value.trim() : '';
      const accountNumber = accSetting ? accSetting.value.trim() : '';

      console.log('API Key:', apiKey ? apiKey.slice(0, 15) + '...' : 'NONE');
      console.log('Account Number:', accountNumber);

      console.log('\\n1. Testing GET https://livepay.me/api/check-balance ...');
      try {
        const res1 = await fetch('https://livepay.me/api/check-balance', {
          headers: { 'Authorization': 'Bearer ' + apiKey }
        });
        console.log('Balance Status Code:', res1.status);
        console.log('Balance Response:', await res1.text());
      } catch (e1) {
        console.error('Balance Error:', e1.message);
      }

      console.log('\\n2. Testing POST https://livepay.me/api/collect-money ...');
      try {
        const res2 = await fetch('https://livepay.me/api/collect-money', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountNumber: accountNumber,
            phoneNumber: '256770000000',
            amount: 2000,
            currency: 'UGX',
            reference: 'LP_TEST_' + Date.now().toString().slice(-6),
            description: 'MovieZone Test Verification'
          })
        });
        console.log('Collect Money Status Code:', res2.status);
        console.log('Collect Money Response:', await res2.text());
      } catch (e2) {
        console.error('Collect Error:', e2.message);
      }

      process.exit(0);
    }

    run().catch(e => { console.error(e); process.exit(1); });
    """

    cmd = f"""docker exec moviezone_backend node -e "{node_script}" """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:\n", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:\n", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    test_livepay_whitelisted()
