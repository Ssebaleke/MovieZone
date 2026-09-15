import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def setup_domain():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    nginx_config = """server {
    server_name vjpulse.site www.vjpulse.site;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;

    listen 80;
}
"""

    cmd = f"""
    cat << 'EOF' > /etc/nginx/sites-enabled/vjpulse.site.conf
{nginx_config}
EOF
    nginx -t && systemctl reload nginx
    """

    print("=== WRITING NGINX CONFIG & TESTING ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))

    print("\n=== ATTEMPTING CERTBOT SSL ISSUANCE ===")
    certbot_cmd = "certbot --nginx -d vjpulse.site -d www.vjpulse.site --non-interactive --agree-tos --redirect -m admin@vjpulse.site"
    stdin, stdout, stderr = ssh.exec_command(certbot_cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))

    ssh.close()

if __name__ == '__main__':
    setup_domain()
