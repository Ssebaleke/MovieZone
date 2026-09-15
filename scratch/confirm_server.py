import paramiko

def check_server():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('69.164.245.17', username='root', password='Vico@2026', timeout=15)

    # 1. Check docker container status and image build date/commit
    stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    print("=== DOCKER CONTAINERS ===")
    print(stdout.read().decode())

    # 2. Check git commit on the server
    cmd_git = """
    for dir in /root/* /home/* /var/www/* /opt/*; do
        if [ -d "$dir/.git" ]; then
            echo "Found git repo in $dir"
            cd "$dir"
            git log -n 1 --oneline
            git status -s
        fi
    done
    """
    stdin, stdout, stderr = ssh.exec_command(cmd_git)
    print("=== GIT STATUS ON SERVER ===")
    print(stdout.read().decode())

    # 3. Pull & Rebuild directly in the found directory
    cmd_deploy = """
    for dir in /root/* /home/* /var/www/* /opt/*; do
        if [ -f "$dir/docker-compose.yml" ]; then
            echo "Deploying in $dir"
            cd "$dir"
            git fetch origin main
            git reset --hard origin/main
            docker compose build frontend || docker-compose build frontend
            docker compose up -d || docker-compose up -d
            break
        fi
    done
    """
    print("=== EXECUTING REBUILD & DEPLOY ===")
    stdin, stdout, stderr = ssh.exec_command(cmd_deploy)
    print(stdout.read().decode())
    print(stderr.read().decode())

    ssh.close()

if __name__ == '__main__':
    check_server()
