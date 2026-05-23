import serial.tools.list_ports
import time

def get_ports():
    ports = {}

    for p in serial.tools.list_ports.comports():
        ports[p.device] = {
            "description": p.description,
            "hwid": p.hwid
        }

    return ports

print("Capturing current devices...")
before = get_ports()

print("\nConnect/disconnect your device now...")
input("Press ENTER after device manager refreshes...")

time.sleep(3)

after = get_ports()

print("\n========== CHANGES DETECTED ==========\n")

# Added ports
for port in after:
    if port not in before:
        print(f"[NEW] {port}")
        print(f"      Desc : {after[port]['description']}")
        print(f"      HWID : {after[port]['hwid']}\n")

# Removed ports
for port in before:
    if port not in after:
        print(f"[REMOVED] {port}")
        print(f"           Desc : {before[port]['description']}")
        print(f"           HWID : {before[port]['hwid']}\n")

# Changed devices
for port in after:
    if port in before:
        if after[port] != before[port]:
            print(f"[CHANGED] {port}")
            print(f"   OLD : {before[port]}")
            print(f"   NEW : {after[port]}\n")

print("Done.")