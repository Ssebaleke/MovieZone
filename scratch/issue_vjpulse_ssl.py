import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def setup_ssl():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=30)

    print("=== ISSUING CERTBOT SSL CERTIFICATE FOR vjpulse.site ===")
    certbot_cmd = "certbot --nginx -d vjpulse.site --non-interactive --agree-tos --redirect -m admin@vjpulse.site"
    stdin, stdout, stderr = ssh.exec_command(certbot_cmd)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')

    print("STDOUT:\n", out)
    print("STDERR:\n", err)

    print("=== TESTING NGINX CONFIG ===")
    stdin, stdout, stderr = ssh.exec_command("nginx -t && systemctl reload nginx")
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'))

    ssh.close()

if __name__ == '__main__':
    setup_ssl()
