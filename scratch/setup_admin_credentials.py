import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def setup_admin_logins():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    node_script = """
    import bcrypt from 'bcryptjs';
    import prisma from './db.js';

    async function run() {
      const hash = await bcrypt.hash('Vico@2026', 10);

      // Account 1: admin@vjpulse.site
      await prisma.user.upsert({
        where: { email: 'admin@vjpulse.site' },
        update: { passwordHash: hash, role: 'ADMIN', plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' },
        create: { email: 'admin@vjpulse.site', passwordHash: hash, role: 'ADMIN', plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' }
      });

      // Account 2: jsvico100@gmail.com
      await prisma.user.upsert({
        where: { email: 'jsvico100@gmail.com' },
        update: { passwordHash: hash, role: 'ADMIN', plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' },
        create: { email: 'jsvico100@gmail.com', passwordHash: hash, role: 'ADMIN', plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' }
      });

      console.log('SUCCESS: Admin credentials created/updated with password Vico@2026');
      process.exit(0);
    }
    run().catch(e => { console.error(e); process.exit(1); });
    """

    cmd = f"""docker exec moviezone_backend node -e "{node_script}" """

    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))
    ssh.close()

if __name__ == '__main__':
    setup_admin_logins()
