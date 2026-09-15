import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_package_db():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    node_script = """
    import prisma from './db.js';

    async function run() {
      console.log('=== TESTING PRISMA PACKAGE CREATE ===');
      try {
        const p = await prisma.package.create({
          data: {
            name: 'Test Package ' + Date.now(),
            slug: 'test-pkg-' + Date.now(),
            price: 2000,
            currency: 'UGX',
            interval: '1_DAYS',
            description: 'Test Description',
            features: 'Test Features',
            resolution: '1080p Full HD',
            screens: 2,
            isActive: true
          }
        });
        console.log('CREATE SUCCESS:', p);
      } catch (err) {
        console.error('PRISMA CREATE ERROR:', err.message);
        console.error(err);
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
    test_package_db()
