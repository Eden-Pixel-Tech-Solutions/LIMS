# alta_3part_interactive_simulator.py

import socket
import random
from datetime import datetime

# ==========================================
# HL7 CONTROL CHARACTERS
# ==========================================
VT = b'\x0b'
FS = b'\x1c'
CR = b'\x0d'

print("=" * 60)
print("ALTA 3 PART HEMATOLOGY ANALYZER")
print("INTERACTIVE HL7 SIMULATOR")
print("=" * 60)

# ==========================================
# STEP 1 - SERVER IP
# ==========================================
host = input("\n1. Enter LIS Server IP: ").strip()

if not host:
    host = "127.0.0.1"

# ==========================================
# STEP 2 - PORT
# ==========================================
port_input = input("2. Enter Port: ").strip()

if not port_input:
    port = 9527
else:
    port = int(port_input)

# ==========================================
# STEP 3 - CONNECT
# ==========================================
connect_choice = input("3. Can I Connect? (1 = Yes): ").strip()

if connect_choice != "1":

    print("Connection Cancelled")
    exit()

try:

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    sock.connect((host, port))

    print(f"\nCONNECTED TO LIS SERVER {host}:{port}")

except Exception as e:

    print("\nCONNECTION FAILED")
    print(e)

    exit()

last_message = b""

# ==========================================
# MAIN LOOP
# ==========================================
while True:

    try:

        print("\n")

        # ==========================================
        # SAMPLE ID
        # ==========================================
        sample_id = input("4. Enter Sample ID: ").strip()

        if not sample_id:

            print("Sample ID Required")
            continue

        # ==========================================
        # SEND CONFIRMATION
        # ==========================================
        send_choice = input("5. Can I Send? (1 = Yes): ").strip()

        if send_choice != "1":

            print("Cancelled")
            continue

        # ==========================================
        # RANDOM CBC VALUES
        # ==========================================
        wbc = round(random.uniform(4.0, 11.0), 2)
        neu_percent = round(random.uniform(40, 75), 1)
        lym_percent = round(random.uniform(20, 45), 1)
        mon_percent = round(random.uniform(2, 10), 1)
        eos_percent = round(random.uniform(1, 6), 1)
        bas_percent = round(random.uniform(0, 2), 1)

        neu_abs = round(random.uniform(2.0, 7.0), 2)
        lym_abs = round(random.uniform(1.0, 4.0), 2)
        mon_abs = round(random.uniform(0.2, 1.0), 2)
        eos_abs = round(random.uniform(0.02, 0.5), 2)
        bas_abs = round(random.uniform(0.01, 0.2), 2)

        rbc = round(random.uniform(4.0, 6.0), 2)
        hgb = round(random.uniform(12.0, 17.0), 1)
        mcv = round(random.uniform(80, 100), 1)
        hct = round(random.uniform(36, 50), 1)
        mch = round(random.uniform(26, 34), 1)
        mchc = round(random.uniform(31, 36), 1)

        rdw_sd = round(random.uniform(35, 55), 1)
        rdw_cv = round(random.uniform(11, 16), 1)

        plt = random.randint(150, 450)
        mpv = round(random.uniform(7, 12), 1)
        pct = round(random.uniform(0.1, 0.5), 2)
        pdw = round(random.uniform(9, 18), 1)
        p_lcr = round(random.uniform(15, 45), 1)
        p_lcc = random.randint(20, 120)

        crp = round(random.uniform(0.1, 6.0), 2)

        current_time = datetime.now().strftime('%Y%m%d%H%M%S')

        # ==========================================
        # HL7 MESSAGE
        # ==========================================
        hl7_message = (
            f"MSH|^~\\&|ALTA3PART|LAB|LIS|HOSPITAL|{current_time}||ORU^R01|1|P|2.3.1\r"

            f"PID|1||P{sample_id}||STEVE^JERALD||20051016|M\r"

            f"OBR|1||{sample_id}|CBC\r"

            f"OBX|1|NM|2006^WBC||{wbc}|10^3/uL|4.0-11.0|N\r"
            f"OBX|2|NM|2007^NEU%||{neu_percent}|%|40-75|N\r"
            f"OBX|3|NM|2008^LYM%||{lym_percent}|%|20-45|N\r"
            f"OBX|4|NM|2009^MON%||{mon_percent}|%|2-10|N\r"
            f"OBX|5|NM|2010^EOS%||{eos_percent}|%|1-6|N\r"
            f"OBX|6|NM|2011^BAS%||{bas_percent}|%|0-2|N\r"

            f"OBX|7|NM|2012^NEU#||{neu_abs}|10^3/uL|2.0-7.0|N\r"
            f"OBX|8|NM|2013^LYM#||{lym_abs}|10^3/uL|1.0-4.0|N\r"
            f"OBX|9|NM|2014^MON#||{mon_abs}|10^3/uL|0.2-1.0|N\r"
            f"OBX|10|NM|2015^EOS#||{eos_abs}|10^3/uL|0.02-0.5|N\r"
            f"OBX|11|NM|2016^BAS#||{bas_abs}|10^3/uL|0.01-0.2|N\r"

            f"OBX|12|NM|2017^RBC||{rbc}|10^6/uL|4.0-6.0|N\r"
            f"OBX|13|NM|2018^HGB||{hgb}|g/dL|12-17|N\r"
            f"OBX|14|NM|2019^MCV||{mcv}|fL|80-100|N\r"
            f"OBX|15|NM|2020^HCT||{hct}|%|36-50|N\r"
            f"OBX|16|NM|2021^MCH||{mch}|pg|26-34|N\r"
            f"OBX|17|NM|2022^MCHC||{mchc}|g/dL|31-36|N\r"

            f"OBX|18|NM|2023^RDW_SD||{rdw_sd}|fL|35-55|N\r"
            f"OBX|19|NM|2024^RDW_CV||{rdw_cv}|%|11-16|N\r"

            f"OBX|20|NM|2025^PLT||{plt}|10^3/uL|150-450|N\r"
            f"OBX|21|NM|2026^MPV||{mpv}|fL|7-12|N\r"
            f"OBX|22|NM|2027^PCT||{pct}|%|0.1-0.5|N\r"
            f"OBX|23|NM|2028^PDW||{pdw}|fL|9-18|N\r"
            f"OBX|24|NM|2029^P_LCR||{p_lcr}|%|15-45|N\r"
            f"OBX|25|NM|2030^P_LCC||{p_lcc}|10^9/L|20-120|N\r"

            f"OBX|26|NM|2031^CRP||{crp}|mg/L|0-6|N\r"
        )

        framed_message = (
            VT +
            hl7_message.encode() +
            FS + CR
        )

        # ==========================================
        # SEND HL7
        # ==========================================
        sock.sendall(framed_message)

        last_message = framed_message

        print("\nCBC RESULT SENT")
        print("-" * 60)
        print(hl7_message)
        print("-" * 60)

        # ==========================================
        # RECEIVE ACK
        # ==========================================
        ack = sock.recv(4096)

        if ack:

            cleaned_ack = (
                ack
                .replace(VT, b'')
                .replace(FS + CR, b'')
                .decode('utf-8', errors='ignore')
            )

            print("\nACK RECEIVED")
            print("-" * 60)
            print(cleaned_ack)
            print("-" * 60)

        # ==========================================
        # RESEND
        # ==========================================
        resend = input("6. Resend? (1 = Yes): ").strip()

        if resend == "1":

            sock.sendall(last_message)

            print("\nRESULT RESENT")

            ack = sock.recv(4096)

            if ack:

                cleaned_ack = (
                    ack
                    .replace(VT, b'')
                    .replace(FS + CR, b'')
                    .decode('utf-8', errors='ignore')
                )

                print("\nACK RECEIVED")
                print("-" * 60)
                print(cleaned_ack)
                print("-" * 60)

    except KeyboardInterrupt:

        print("\nSimulator Stopped")

        sock.close()

        break

    except Exception as e:

        print("\nERROR:", e)