import socket
import time
import re

# ==========================================
# SERVER CONFIG
# ==========================================

HOST = "0.0.0.0"
PORT = 7000

# ==========================================
# ASTM CONTROL CHARACTERS
# ==========================================

ACK = b'\x06'
ENQ = b'\x05'
EOT = b'\x04'
STX = b'\x02'

# ==========================================
# TEST CODE MAPPING
# ==========================================

test_map = {
    "1025": "Ferritin",
    "1014": "TT3",
    "1011": "TSH",
    "1046": "25-OH Vitamin D"
}

# ==========================================
# SAMPLE TYPE MAPPING
# ==========================================

sample_type_map = {
    "S1": "Serum",
    "P1": "Plasma",
    "U1": "Urine",
    "WB": "Whole Blood"
}

# ==========================================
# CREATE SERVER
# ==========================================

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server.bind((HOST, PORT))
server.listen(5)

print("=" * 60)
print("MISPA i200 ASTM TCP SERVER")
print(f"Listening on Port {PORT}")
print("=" * 60)

# ==========================================
# MAIN LOOP
# ==========================================

while True:

    conn, addr = server.accept()

    print(f"\nCONNECTED: {addr}")

    astm_text = ""

    while True:

        try:

            data = conn.recv(4096)

            if not data:
                break

            # ==================================
            # DEBUG RAW DATA
            # ==================================

            print("\nRAW:")
            print(data)

            print("\nHEX:")
            print(data.hex())

            # ==================================
            # ENQ
            # ==================================

            if data == ENQ:

                print("\nENQ RECEIVED")

                time.sleep(0.2)

                conn.sendall(ACK)

                print("ACK SENT")

                continue

            # ==================================
            # EOT
            # ==================================

            elif data == EOT:

                print("\nEOT RECEIVED")

                break

            # ==================================
            # ASTM FRAME
            # ==================================

            elif data.startswith(STX):

                print("\nFRAME RECEIVED")

                time.sleep(0.2)

                conn.sendall(ACK)

                print("FRAME ACK SENT")

            # ==================================
            # CLEAN FRAME
            # ==================================

            frame = data.decode(
                'ascii',
                errors='ignore'
            )

            # Remove ASTM control chars

            frame = frame.replace('\x02', '')
            frame = frame.replace('\x03', '')
            frame = frame.replace('\x04', '')
            frame = frame.replace('\x05', '')
            frame = frame.replace('\x17', '')
            frame = frame.replace('\n', '')

            # Remove ASTM frame number
            # Example:
            # 1H|
            # 2P|
            # 3O|

            frame = re.sub(r'^[0-9]', '', frame)

            # Remove checksum

            frame = re.sub(r'[A-F0-9]{2}\r?$', '', frame)

            astm_text += frame

        except Exception as e:

            print("ERROR:", e)
            break

    conn.close()

    print("\nDISCONNECTED")

    # ==========================================
    # CLEAN ASTM DISPLAY
    # ==========================================

    print("\n========== CLEAN ASTM ==========\n")
    print(astm_text)

    # ==========================================
    # PARSE ASTM
    # ==========================================

    lines = astm_text.split('\r')

    sample_name = ""
    sample_no = ""
    position = ""
    sample_type = ""
    status = "H"
    test_complete_time = ""

    results = []

    for line in lines:

        fields = line.split('|')

        if len(fields) == 0:
            continue

        segment = fields[0]

        # ==================================
        # ORDER RECORD
        # ==================================

        if segment == 'O':

            try:

                # Sample Name

                sample_name = fields[2]

                # Order Info
                # Example:
                # 1848^5003^2^^S1^SC

                order_info = fields[3].split('^')

                # ==================================
                # SAMPLE NUMBER
                # ==================================

                sample_no = (
                    f"N{order_info[0].zfill(5)}"
                )

                # ==================================
                # POSITION
                # ==================================

                rack = ""
                pos = ""

                if len(order_info) > 1:
                    rack = order_info[1]

                if len(order_info) > 2:
                    pos = order_info[2]

                position = f"{rack}-{pos}"

                # ==================================
                # SAMPLE TYPE
                # ==================================

                if len(order_info) > 4:

                    sample_code = order_info[4]

                    sample_type = sample_type_map.get(
                        sample_code,
                        sample_code
                    )

                # ==================================
                # TEST COMPLETE TIME
                # ==================================

                time_match = re.search(
                    r'(\d{14})',
                    line
                )

                if time_match:

                    raw_time = time_match.group(1)

                    test_complete_time = (
                        f"{raw_time[0:4]}/"
                        f"{raw_time[4:6]}/"
                        f"{raw_time[6:8]} "
                        f"{raw_time[8:10]}:"
                        f"{raw_time[10:12]}:"
                        f"{raw_time[12:14]}"
                    )

            except Exception as e:

                print("ORDER PARSE ERROR:", e)

        # ==================================
        # RESULT RECORD
        # ==================================

        elif segment == 'R':

            try:

                raw_test = fields[2]

                value = fields[3]

                unit = fields[4]

                # ==================================
                # EXTRACT TEST CODE
                # ==================================

                match = re.search(
                    r'(\d+)',
                    raw_test
                )

                if match:

                    code = match.group(1)

                    test_name = test_map.get(
                        code,
                        f"UNKNOWN_{code}"
                    )

                else:

                    test_name = raw_test

                # ==================================
                # RESULT ARROW
                # ==================================

                arrow = ""

                try:

                    numeric_value = float(value)

                    # TT3

                    if test_name == "TT3":

                        if numeric_value < 1.6:
                            arrow = "↓"

                        elif numeric_value > 3.5:
                            arrow = "↑"

                    # TSH

                    elif test_name == "TSH":

                        if numeric_value > 5:
                            arrow = "↑"

                        elif numeric_value < 0.4:
                            arrow = "↓"

                except:
                    pass

                # ==================================
                # RESULT STATUS
                # ==================================

                result_status = "Cali.E"

                # Ferritin special case

                if test_name == "Ferritin":

                    result_status = "Cali.E; ReaOpen"

                # ==================================
                # STORE RESULT
                # ==================================

                results.append({
                    "test": test_name,
                    "value": value,
                    "unit": unit,
                    "status": result_status,
                    "arrow": arrow
                })

            except Exception as e:

                print("RESULT PARSE ERROR:", e)

    # ==========================================
    # DISPLAY RESULTS
    # ==========================================

    print("\n========== PARSED RESULTS ==========\n")

    print(f"Status             : {status}")
    print(f"Sample No          : {sample_no}")
    print(f"Sample Name        : {sample_name}")
    print(f"Position           : {position}")
    print(f"Sample Type        : {sample_type}")
    print(f"Test Complete Time : {test_complete_time}")

    print("\nResults:\n")

    for r in results:

        print(
            f"{r['test']} : "
            f"{r['value']} "
            f"{r['unit']} "
            f"{r['arrow']} "
            f"[{r['status']}]"
        )

    print("\n===================================")