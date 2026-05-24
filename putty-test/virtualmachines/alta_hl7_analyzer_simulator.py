# alta_hl7_hematology_simulator.py

import socket
import random
from datetime import datetime

# ==========================================
# HL7 CONTROL CHARACTERS (MLLP Framing)
# ==========================================
VT = b'\x0b'
FS = b'\x1c'
CR = b'\x0d'

# ==========================================
# PARAMETER MAP (mirrors tcpServer.js exactly)
# ==========================================
PARAMETER_MAP = {
    '2006': ('WBC',     0.1,   lambda: round(random.uniform(4.0,   11.0),  2), '10^9/L', '4.0-11.0'),
    '2007': ('NEU%',    0.1,   lambda: round(random.uniform(45.0,  75.0),  1), '%',      '45.0-75.0'),
    '2008': ('LYM%',    0.1,   lambda: round(random.uniform(20.0,  40.0),  1), '%',      '20.0-40.0'),
    '2009': ('MON%',    0.1,   lambda: round(random.uniform(2.0,   10.0),  1), '%',      '2.0-10.0'),
    '2010': ('EOS%',    0.1,   lambda: round(random.uniform(1.0,   6.0),   1), '%',      '1.0-6.0'),
    '2011': ('BAS%',    0.1,   lambda: round(random.uniform(0.0,   1.0),   1), '%',      '0.0-1.0'),
    '2012': ('NEU#',    0.1,   lambda: round(random.uniform(1.8,   7.7),   2), '10^9/L', '1.8-7.7'),
    '2013': ('LYM#',    0.1,   lambda: round(random.uniform(1.0,   4.8),   2), '10^9/L', '1.0-4.8'),
    '2014': ('MON#',    0.1,   lambda: round(random.uniform(0.1,   1.0),   2), '10^9/L', '0.1-1.0'),
    '2015': ('EOS#',    0.1,   lambda: round(random.uniform(0.0,   0.5),   2), '10^9/L', '0.0-0.5'),
    '2016': ('BAS#',    0.1,   lambda: round(random.uniform(0.0,   0.1),   2), '10^9/L', '0.0-0.1'),
    '2017': ('RBC',     0.1,   lambda: round(random.uniform(4.5,   5.5),   2), '10^12/L','4.5-5.5'),
    '2018': ('HGB',     0.1,   lambda: round(random.uniform(12.0,  17.0),  1), 'g/dL',   '12.0-17.0'),
    '2019': ('MCV',     0.1,   lambda: round(random.uniform(80.0,  100.0), 1), 'fL',     '80.0-100.0'),
    '2020': ('HCT',     0.1,   lambda: round(random.uniform(37.0,  52.0),  1), '%',      '37.0-52.0'),
    '2021': ('MCH',     0.1,   lambda: round(random.uniform(27.0,  33.0),  1), 'pg',     '27.0-33.0'),
    '2022': ('MCHC',    0.1,   lambda: round(random.uniform(32.0,  36.0),  1), 'g/dL',   '32.0-36.0'),
    '2023': ('RDW-SD',  0.1,   lambda: round(random.uniform(37.0,  54.0),  1), 'fL',     '37.0-54.0'),
    '2024': ('RDW-CV',  0.1,   lambda: round(random.uniform(11.5,  14.5),  1), '%',      '11.5-14.5'),
    '2025': ('PLT',     0.1,   lambda: round(random.uniform(150.0, 400.0), 0), '10^9/L', '150-400'),
    '2026': ('MPV',     0.1,   lambda: round(random.uniform(7.5,   12.5),  1), 'fL',     '7.5-12.5'),
    '2027': ('PCT',     0.1,   lambda: round(random.uniform(0.1,   0.5),   3), '%',      '0.1-0.5'),
    '2028': ('PDW',     0.1,   lambda: round(random.uniform(9.0,   17.0),  1), 'fL',     '9.0-17.0'),
    '2029': ('P-LCR',   0.1,   lambda: round(random.uniform(11.0,  45.0),  1), '%',      '11.0-45.0'),
    '2030': ('P-LCC',   0.1,   lambda: round(random.uniform(30.0,  90.0),  0), '10^9/L', '30-90'),
    '2031': ('CRP',     0.1,   lambda: round(random.uniform(0.0,   5.0),   2), 'mg/L',   '0.0-5.0'),
}

# ==========================================
# FLAG HELPER
# ==========================================
def get_flag(param_name, value):
    HIGH_FLAGS = {'WBC', 'RBC', 'HGB', 'HCT', 'PLT', 'CRP'}
    LOW_FLAGS  = {'WBC', 'RBC', 'HGB', 'HCT', 'PLT'}
    # Simple logic: just return N for simulator
    return 'N'

# ==========================================
# BANNER
# ==========================================
print("=" * 60)
print("  ALTA HEMATOLOGY ANALYZER")
print("  INTERACTIVE HL7 SIMULATOR")
print("  Parameters: CBC 26-Diff + CRP")
print("=" * 60)

# ==========================================
# STEP 1 - SERVER IP
# ==========================================
host = input("\n1. Enter LIS Server IP [127.0.0.1]: ").strip()
if not host:
    host = "127.0.0.1"

# ==========================================
# STEP 2 - PORT
# ==========================================
port_input = input("2. Enter Port [9527]: ").strip()
port = int(port_input) if port_input else 9527

# ==========================================
# STEP 3 - SERIAL NUMBER
# (Matches MSH[3] -> server's serial_number -> machine resolution)
# ==========================================
serial_number = input("3. Enter Machine Serial Number [ALTA-SN-001]: ").strip()
if not serial_number:
    serial_number = "ALTA-SN-001"

# ==========================================
# STEP 4 - CONNECT
# ==========================================
connect_choice = input("4. Connect? (1 = Yes): ").strip()
if connect_choice != "1":
    print("Connection Cancelled.")
    exit()

try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((host, port))
    print(f"\n✅ CONNECTED TO LIS SERVER {host}:{port}")
except Exception as e:
    print(f"\n❌ CONNECTION FAILED: {e}")
    exit()

# ==========================================
# MAIN LOOP
# ==========================================
while True:

    try:

        print("\n" + "-" * 60)

        # ==========================================
        # SAMPLE ID
        # (Maps to OBR[3] -> server's sessionKey)
        # ==========================================
        sample_id = input("5. Enter Sample ID: ").strip()
        if not sample_id:
            print("⚠  Sample ID Required.")
            continue

        # ==========================================
        # PATIENT INFO
        # ==========================================
        patient_name = input("6. Patient Name [Test Patient]: ").strip()
        if not patient_name:
            patient_name = "Test Patient"

        gender_input = input("7. Gender (M/F) [M]: ").strip().upper()
        gender = gender_input if gender_input in ('M', 'F') else 'M'

        # ==========================================
        # PARAMETER SELECTION
        # ==========================================
        print("\n   Parameter Options:")
        print("   [1] Full Panel (All 27 parameters)")
        print("   [2] CBC Only (WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT)")
        print("   [3] Custom (pick codes manually)")
        param_choice = input("8. Select Panel [1]: ").strip()

        CBC_CORE = {'2006', '2017', '2018', '2019', '2020', '2021', '2022', '2025'}

        if param_choice == '2':
            selected_codes = CBC_CORE
        elif param_choice == '3':
            print("\n   Available codes:")
            for code, (name, *_) in PARAMETER_MAP.items():
                print(f"   {code} = {name}")
            raw = input("   Enter comma-separated codes: ").strip()
            selected_codes = {c.strip() for c in raw.split(',') if c.strip() in PARAMETER_MAP}
            if not selected_codes:
                print("⚠  No valid codes entered. Using full panel.")
                selected_codes = set(PARAMETER_MAP.keys())
        else:
            selected_codes = set(PARAMETER_MAP.keys())

        # ==========================================
        # GENERATE RANDOM VALUES
        # ==========================================
        generated = {}
        for code in selected_codes:
            name, _, gen_fn, unit, ref = PARAMETER_MAP[code]
            generated[code] = {
                'name': name,
                'value': gen_fn(),
                'unit': unit,
                'ref': ref
            }

        # ==========================================
        # SEND CONFIRMATION
        # ==========================================
        send_choice = input("\n9. Send HL7 to LIS? (1 = Yes): ").strip()
        if send_choice != "1":
            print("Cancelled.")
            continue

        # ==========================================
        # BUILD HL7 MESSAGE
        # OBX field[3] uses numeric codes (e.g. 2006)
        # so server's parameter_map resolves them to WBC, HGB etc.
        # ==========================================
        current_time = datetime.now().strftime('%Y%m%d%H%M%S')

        msh = f"MSH|^~\\&|{serial_number}|LAB|LIS|HOSPITAL|{current_time}||ORU^R01|{current_time}|P|2.3.1\r"
        pid = f"PID|1||{sample_id}||{patient_name}||19900101|{gender}\r"
        obr = f"OBR|1||{sample_id}|HEMATOLOGY\r"

        obx_lines = ""
        for idx, (code, data) in enumerate(generated.items(), start=1):
            flag = get_flag(data['name'], data['value'])
            # field[3] = numeric code (e.g. 2006) -> server maps to WBC
            # field[5] = value
            # field[6] = unit
            # field[7] = reference range
            # field[8] = flag
            obx_lines += f"OBX|{idx}|NM|{code}||{data['value']}|{data['unit']}|{data['ref']}|{flag}\r"

        hl7_message = msh + pid + obr + obx_lines

        framed_message = VT + hl7_message.encode('utf-8') + FS + CR

        # ==========================================
        # SEND
        # ==========================================
        sock.sendall(framed_message)

        print("\n✅ HL7 RESULT SENT")
        print("=" * 60)
        print(hl7_message)
        print("=" * 60)

        # Preview table
        print(f"\n{'CODE':<6}  {'PARAM':<10}  {'VALUE':<10}  {'UNIT':<10}  {'REF RANGE'}")
        print("-" * 56)
        for code, data in generated.items():
            print(f"{code:<6}  {data['name']:<10}  {str(data['value']):<10}  {data['unit']:<10}  {data['ref']}")

        # ==========================================
        # WAIT FOR ACK
        # ==========================================
        try:
            sock.settimeout(10)
            ack_raw = sock.recv(4096)
            sock.settimeout(None)

            if ack_raw:
                cleaned_ack = (
                    ack_raw
                    .replace(VT, b'')
                    .replace(FS + CR, b'')
                    .decode('utf-8', errors='ignore')
                    .strip()
                )
                print("\n✅ ACK RECEIVED FROM LIS")
                print("-" * 60)
                print(cleaned_ack)
                print("-" * 60)
            else:
                print("\n⚠  No ACK received (empty response).")

        except socket.timeout:
            print("\n⚠  ACK TIMEOUT — LIS did not respond within 10 seconds.")

        # ==========================================
        # RESEND OPTION
        # ==========================================
        resend = input("\n10. Resend same result? (1 = Yes): ").strip()
        if resend == "1":
            sock.sendall(framed_message)
            print("\n🔁 RESULT RESENT")

            try:
                sock.settimeout(10)
                ack_raw = sock.recv(4096)
                sock.settimeout(None)

                if ack_raw:
                    cleaned_ack = (
                        ack_raw
                        .replace(VT, b'')
                        .replace(FS + CR, b'')
                        .decode('utf-8', errors='ignore')
                        .strip()
                    )
                    print("\n✅ ACK RECEIVED")
                    print("-" * 60)
                    print(cleaned_ack)
                    print("-" * 60)

            except socket.timeout:
                print("\n⚠  ACK TIMEOUT on resend.")

    except KeyboardInterrupt:
        print("\n\nSimulator Stopped.")
        sock.close()
        break

    except BrokenPipeError:
        print("\n❌ Connection lost (Broken Pipe). Attempting reconnect...")
        try:
            sock.close()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((host, port))
            print(f"✅ Reconnected to {host}:{port}")
        except Exception as re:
            print(f"❌ Reconnect failed: {re}")
            break

    except Exception as e:
        print(f"\n❌ ERROR: {e}")