import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_card_collection():
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

      console.log('Testing POST https://livepay.me/api/card-collection ...');
      try {
        const res = await fetch('https://livepay.me/api/card-collection', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountNumber: accountNumber,
            amount: 5.00,
            currency: 'USD',
            reference: 'LPC_TEST_' + Date.now().toString().slice(-6),
            email: 'admin@vjpulse.site',
            name: 'Vico Admin',
            description: 'MovieZone VIP Test',
            return_url: 'https://vjpulse.site/account?checkout=success'
          })
        });
        console.log('Card Collection Status Code:', res.status);
        console.log('Card Collection Response:', await res.text());
      } catch (e) {
        console.error('Card Collection Error:', e.message);
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
    test_card_collection()
