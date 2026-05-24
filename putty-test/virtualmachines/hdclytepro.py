import serial
import random
from datetime import datetime
import sys
import time

# ==========================================
# SERIAL CONFIG
# ==========================================
PORT = '/tmp/cu.analyzer_in'
BAUD_RATE = 9600

ser = None
last_message = ""

# ==========================================
# CONNECT SERIAL
# ==========================================
def connect_serial():

    global ser

    try:

        ser = serial.Serial(
            port=PORT,
            baudrate=BAUD_RATE,
            timeout=1
        )

        print("\n[STATUS] ANALYZER PORT ACTIVE")
        print(f"[CONNECTED] {PORT}")

        return True

    except Exception as e:

        print("\n[ERROR] PORT CONNECTION FAILED")
        print(e)

        return False


# ==========================================
# CLOSE SERIAL
# ==========================================
def close_serial():

    global ser

    try:

        if ser and ser.is_open:

            ser.close()

            print("\n[STATUS] ANALYZER PORT DEACTIVATED")
            print(f"[DISCONNECTED] {PORT}")

    except Exception as e:

        print("CLOSE ERROR:", e)


# ==========================================
# STARTUP
# ==========================================
print("=" * 60)
print("HDC-LYTE PRO INTERACTIVE ANALYZER SIMULATOR")
print("=" * 60)

if not connect_serial():

    sys.exit()

# ==========================================
# MAIN LOOP
# ==========================================
while True:

    try:

        print("\n")

        # ==========================================
        # AUTO RECONNECT IF DISCONNECTED
        # ==========================================
        if not ser.is_open:

            print("[INFO] RECONNECTING PORT...")

            connect_serial()

        # ==========================================
        # PATIENT ID
        # ==========================================
        patient_id = input("1. Enter Patient ID: ").strip()

        if not patient_id:

            print("Patient ID Required")
            continue

        # ==========================================
        # SEND CONFIRMATION
        # ==========================================
        send_choice = input("2. Can I Send It? (1 = Yes): ").strip()

        if send_choice != "1":

            print("Cancelled")

            continue

        # ==========================================
        # RANDOM RESULTS
        # ==========================================
        na = round(random.uniform(135, 145), 1)
        k = round(random.uniform(3.5, 5.5), 1)
        ica = round(random.uniform(1.10, 1.35), 2)
        cl = round(random.uniform(98, 107), 1)
        ph = round(random.uniform(7.35, 7.45), 2)
        li = round(random.uniform(0.2, 1.0), 2)

        # ==========================================
        # MESSAGE FORMAT
        # ==========================================
        message = f"""
Name : STEVE
Patient ID : {patient_id}
Date time: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
Na = {na}
K = {k}
iCa = {ica}
Cl = {cl}
pH = {ph}
Li = {li}
"""

        # ==========================================
        # SEND RESULT
        # ==========================================
        ser.write(message.encode())

        last_message = message

        print("\n[RESULT SENT SUCCESSFULLY]")
        print("-" * 40)
        print(message)
        print("-" * 40)

        # ==========================================
        # RESEND
        # ==========================================
        resend = input("3. Resend? (1 = Yes): ").strip()

        if resend == "1":

            ser.write(last_message.encode())

            print("\n[RESULT RESENT]")
            print("-" * 40)
            print(last_message)
            print("-" * 40)

    except KeyboardInterrupt:

        print("\nSIMULATOR STOPPED")

        close_serial()

        break

    except serial.SerialException:

        print("\n[SERIAL DISCONNECTED]")
        print("[WAITING FOR RECONNECT...]")

        close_serial()

        time.sleep(2)

        connect_serial()

    except Exception as e:

        print("\nERROR:", e)

# ==========================================
# FINAL CLEANUP
# ==========================================
close_serial()