import paramiko
from io import StringIO

def setup_key():
    # 1. Generate RSA key pair
    key = paramiko.RSAKey.generate(2048)
    out_private = StringIO()
    key.write_private_key(out_private)
    private_key_str = out_private.getvalue()
    public_key_str = f"ssh-rsa {key.get_base64()} github-actions-moviezone"

    # 2. Append public key to VPS authorized_keys
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    cmd = f"""
    mkdir -p /root/.ssh && chmod 700 /root/.ssh
    echo "{public_key_str}" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    stdout.read()
    client.close()

    # 3. Save private key locally to scratch
    with open('scratch/vps_deploy_key.pem', 'w') as f:
        f.write(private_key_str)

    print("SSH KEY SETUP SUCCESSFUL")
    print("PRIVATE KEY:")
    print(private_key_str)

if __name__ == '__main__':
    setup_key()
