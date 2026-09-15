import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def update_nginx():
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

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vjpulse.site/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/vjpulse.site/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    listen 80;
    server_name vjpulse.site www.vjpulse.site;
    return 301 https://vjpulse.site$request_uri;
}
"""

    cmd = f"""
    cat << 'EOF' > /etc/nginx/sites-enabled/vjpulse.site.conf
{nginx_config}
EOF
    nginx -t && systemctl reload nginx
    """

    print("=== UPDATING NGINX CONFIG & RELOADING ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode('utf-8', errors='ignore'))
    print("STDERR:", stderr.read().decode('utf-8', errors='ignore'))

    ssh.close()

if __name__ == '__main__':
    update_nginx()
