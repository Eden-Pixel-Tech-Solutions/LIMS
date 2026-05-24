# laura_smart_analyzer_simulator.py

import serial
import random
from datetime import datetime

# ==========================================
# SERIAL CONFIG
# ==========================================
PORT = '/dev/ttys018'
BAUD_RATE = 19200

# ==========================================
# OPEN SERIAL PORT
# ==========================================
ser = serial.Serial(
    port=PORT,
    baudrate=BAUD_RATE,
    bytesize=serial.EIGHTBITS,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    timeout=1,
    xonxoff=False,
    rtscts=False,
    dsrdtr=False
)

print("=" * 60)
print("LAURA SMART INTERACTIVE ANALYZER SIMULATOR")
print("=" * 60)

last_message = b""

# ==========================================
# MAIN LOOP
# ==========================================
while True:

    try:

        print("\n")

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
        # RANDOM URINE VALUES
        # ==========================================
        glucose = random.choice([
            "NEG",
            "TRACE",
            "1+",
            "2+"
        ])

        protein = random.choice([
            "NEG",
            "TRACE",
            "1+"
        ])

        ketone = random.choice([
            "NEG",
            "TRACE"
        ])

        blood = random.choice([
            "NEG",
            "TRACE"
        ])

        ph = round(random.uniform(5.0, 8.0), 1)

        sg = round(random.uniform(1.005, 1.030), 3)

        leukocytes = random.choice([
            "NEG",
            "TRACE"
        ])

        nitrite = random.choice([
            "NEG",
            "POS"
        ])

        # ==========================================
        # MESSAGE FORMAT
        # ==========================================
        message = f"""
DekaPHAN LAURA
Seq.No: 0001
ID: {patient_id}
{datetime.now().strftime('%d.%m.%Y %H:%M')}

BLD    {blood}
LEU    {leukocytes}
BIL    NEG
UBG    NORM
KET    {ketone}
GLU    {glucose}
PRO    {protein}
pH     {ph}
NIT    {nitrite}
SG     {sg}
--------------------------------
"""

        encoded_message = message.encode()

        # ==========================================
        # SEND DATA
        # ==========================================
        ser.write(encoded_message)

        last_message = encoded_message

        print("\nRESULT SENT")
        print("-" * 60)
        print(message)
        print("-" * 60)

        # ==========================================
        # RESEND OPTION
        # ==========================================
        resend = input("3. Resend? (1 = Yes): ").strip()

        if resend == "1":

            ser.write(last_message)

            print("\nRESULT RESENT")
            print("-" * 60)
            print(message)
            print("-" * 60)

    except KeyboardInterrupt:

        print("\nSimulator Stopped")

        ser.close()

        break

    except Exception as e:

        print("ERROR:", e)