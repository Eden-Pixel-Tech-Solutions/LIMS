#alta-fully-automated-chemistry-analyzer.py
import socket
import json

HOST = "0.0.0.0"
PORT = 9527

# HL7 control characters
VT = b'\x0b'
FS = b'\x1c'
CR = b'\x0d'


def parse_hl7(message):

    lines = message.split('\r')

    patient = {}
    results = {}

    for line in lines:

        if not line.strip():
            continue

        fields = line.split('|')

        segment = fields[0]

        # PID Segment
        if segment == 'PID':

            patient['patient_id'] = fields[3] if len(fields) > 3 else ''
            patient['name'] = fields[5] if len(fields) > 5 else ''
            patient['gender'] = fields[8] if len(fields) > 8 else ''

        # OBR Segment
        elif segment == 'OBR':

            patient['sample_id'] = fields[3] if len(fields) > 3 else ''

        # OBX Segment
        elif segment == 'OBX':

            # Example:
            # OBX|3|NM|0|BIL T|0.969|mg/dl|...

            test_name = fields[4].strip() if len(fields) > 4 else ''
            value = fields[5].strip() if len(fields) > 5 else ''
            unit = fields[6].strip() if len(fields) > 6 else ''
            ref_range = fields[7].strip() if len(fields) > 7 else ''
            flag = fields[8].strip() if len(fields) > 8 else ''

            if test_name:

                results[test_name] = {
                    "value": value,
                    "unit": unit,
                    "reference_range": ref_range,
                    "flag": flag
                }

    return {
        "patient": patient,
        "results": results
    }


# Create TCP socket
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server.bind((HOST, PORT))
server.listen(5)

print(f"HL7 Server Running on Port {PORT}")

while True:

    conn, addr = server.accept()

    print(f"\nAnalyzer Connected: {addr}")

    data_buffer = b''

    while True:

        data = conn.recv(4096)

        if not data:
            break

        data_buffer += data

        # HL7 complete message
        if FS + CR in data_buffer:

            # Remove HL7 framing
            hl7_data = data_buffer.replace(VT, b'').replace(FS + CR, b'')

            message = hl7_data.decode('utf-8', errors='ignore')

            print("\n========== RAW HL7 ==========\n")
            print(message)

            parsed = parse_hl7(message)

            print("\n========== PARSED RESULT ==========\n")
            print(json.dumps(parsed, indent=4))

            # Send HL7 ACK
            ack_message = (
                VT +
                b'MSH|^~\\&|LIS|||Analyzer||20260506120000||ACK^R01|1|P|2.3.1\r'
                b'MSA|AA|1\r' +
                FS + CR
            )

            conn.sendall(ack_message)

            print("\nACK SENT")

            data_buffer = b''

    conn.close()

    print("Analyzer Disconnected")