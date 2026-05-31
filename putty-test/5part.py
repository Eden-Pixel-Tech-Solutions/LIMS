#alta-3part.py

import socket
import json

HOST = "0.0.0.0"
PORT = 9528

# HL7 control characters
VT = b'\x0b'
FS = b'\x1c'
CR = b'\x0d'

parameter_map = {
    '2006': 'WBC',
    '2007': 'NEU%',
    '2008': 'LYM%',
    '2009': 'MON%',
    '2010': 'EOS%',
    '2011': 'BAS%',
    '2012': 'NEU#',
    '2013': 'LYM#',
    '2014': 'MON#',
    '2015': 'EOS#',
    '2016': 'BAS#',
    '2017': 'RBC',
    '2018': 'HGB',
    '2019': 'MCV',
    '2020': 'HCT',
    '2021': 'MCH',
    '2022': 'MCHC',
    '2023': 'RDW_SD',
    '2024': 'RDW_CV',
    '2025': 'PLT',
    '2026': 'MPV',
    '2027': 'PCT',
    '2028': 'PDW',
    '2029': 'P_LCR',
    '2030': 'P_LCC',
    '2031': 'CRP'
}


def parse_hl7(message):

    lines = message.split('\r')

    patient = {}
    results = {}

    for line in lines:

        fields = line.split('|')

        if len(fields) == 0:
            continue

        segment = fields[0]

        # PID
        if segment == 'PID':

            patient['patient_id'] = fields[3] if len(fields) > 3 else ''
            patient['name'] = fields[5] if len(fields) > 5 else ''
            patient['gender'] = fields[8] if len(fields) > 8 else ''

        # OBR
        elif segment == 'OBR':

            patient['sample_id'] = fields[3] if len(fields) > 3 else ''

        # OBX
        elif segment == 'OBX':

            test_info = fields[3] if len(fields) > 3 else ''
            value = fields[5] if len(fields) > 5 else ''

            code_parts = test_info.split('^')

            if len(code_parts) > 0:

                code = code_parts[0]

                if code in parameter_map:
                    results[parameter_map[code]] = value

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

            # Send ACK
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