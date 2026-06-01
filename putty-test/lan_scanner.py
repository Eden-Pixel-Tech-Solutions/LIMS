"""
LAN Network Scanner
Finds all active devices on your network and scans common ports.
Run: python lan_scanner.py
"""

import socket
import subprocess
import threading
import ipaddress
import platform
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Config ──────────────────────────────────────────────────────────────────
SUBNET        = "192.168.1"          # Change this if your network is different
PING_TIMEOUT  = 1                    # seconds
PORT_TIMEOUT  = 0.5                  # seconds
COMMON_PORTS  = [21, 22, 23, 80, 443, 3000, 3306, 5000, 8080, 8443, 9500, 9600, 9999]
MAX_THREADS   = 100
SEP = "─" * 60

# ── Ping a host ──────────────────────────────────────────────────────────────
def ping(ip: str) -> bool:
    system = platform.system().lower()
    if system == "windows":
        cmd = ["ping", "-n", "1", "-w", str(PING_TIMEOUT * 1000), ip]
    else:
        cmd = ["ping", "-c", "1", "-W", str(PING_TIMEOUT), ip]
    try:
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return result.returncode == 0
    except Exception:
        return False

# ── Resolve hostname ─────────────────────────────────────────────────────────
def get_hostname(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ""

# ── Check a single port ──────────────────────────────────────────────────────
def check_port(ip: str, port: int) -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(PORT_TIMEOUT)
        result = s.connect_ex((ip, port))
        s.close()
        return result == 0
    except Exception:
        return False

# ── Scan one IP ──────────────────────────────────────────────────────────────
def scan_ip(ip: str) -> dict | None:
    if not ping(ip):
        return None
    hostname  = get_hostname(ip)
    open_ports = [p for p in COMMON_PORTS if check_port(ip, p)]
    return {"ip": ip, "hostname": hostname, "ports": open_ports}

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Auto-detect local IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "unknown"

    print(SEP)
    print(f"  LAN Scanner")
    print(f"  Your IP  : {local_ip}")
    print(f"  Scanning : {SUBNET}.1 → {SUBNET}.254")
    print(f"  Ports    : {COMMON_PORTS}")
    print(SEP)
    print("  Scanning... (this takes ~15-30 seconds)\n")

    targets = [f"{SUBNET}.{i}" for i in range(1, 255)]
    found   = []

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as ex:
        futures = {ex.submit(scan_ip, ip): ip for ip in targets}
        done    = 0
        for future in as_completed(futures):
            done += 1
            print(f"\r  Progress: {done}/254", end="", flush=True)
            result = future.result()
            if result:
                found.append(result)

    print(f"\r  Progress: 254/254 ✓\n")

    if not found:
        print("  No devices found on the network.")
        return

    found.sort(key=lambda x: int(x["ip"].split(".")[-1]))

    print(f"  Found {len(found)} device(s):\n")
    print(f"  {'IP':<18} {'Hostname':<30} {'Open Ports'}")
    print(f"  {'─'*18} {'─'*30} {'─'*20}")

    for d in found:
        marker   = " ← YOU"  if d["ip"] == local_ip else ""
        ports_str = ", ".join(str(p) for p in d["ports"]) if d["ports"] else "none"
        hostname  = d["hostname"] if d["hostname"] else "—"
        print(f"  {d['ip']:<18} {hostname:<30} {ports_str}{marker}")

    # Highlight port 9500 specifically (analyzer)
    analyzer_candidates = [d for d in found if 9500 in d["ports"]]
    if analyzer_candidates:
        print(f"\n  ✅  Device(s) with port 9500 open (possible analyzer):")
        for d in analyzer_candidates:
            print(f"      → {d['ip']}  {d['hostname']}")
    else:
        print(f"\n  ℹ️   No device found with port 9500 open yet.")
        print(f"      Make sure the analyzer is powered on and LIS is enabled.")

    print(f"\n{SEP}")

if __name__ == "__main__":
    main()
