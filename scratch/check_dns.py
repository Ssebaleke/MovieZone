import socket

def check_dns(domain):
    try:
        ip = socket.gethostbyname(domain)
        print(f"[{domain}] resolves to IP: {ip}")
    except Exception as e:
        print(f"[{domain}] resolution error: {e}")

if __name__ == '__main__':
    check_dns('vjpulse.site')
    check_dns('www.vjpulse.site')
