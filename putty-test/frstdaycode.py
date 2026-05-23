import serial
import struct

PORT = 'COM19'
BAUD = 9600

TEST_MAP = {
    13: "URIC ACID"
}

UNIT_MAP = {
    4: "mg/dL"
}

ser = serial.Serial(PORT, BAUD, timeout=1)

print("Listening... Trigger analyzer")

buffer = bytearray()

while True:
    if ser.in_waiting:
        buffer += ser.read(ser.in_waiting)

        if 0xAA in buffer and 0xF5 in buffer:
            start = buffer.index(0xAA)
            end = buffer.index(0xF5)

            frame = buffer[start:end+1]

            print("Raw Frame:", frame.hex())

            # Decode
            test_code = frame[1]
            unit_code = frame[2]

            patient_id = frame[3:9].decode()

            result = struct.unpack('>f', frame[9:13])[0]
            ref_high = struct.unpack('>f', frame[13:17])[0]
            ref_low = struct.unpack('>f', frame[17:21])[0]

            print("\nDecoded:")
            print("Test:", TEST_MAP.get(test_code, test_code))
            print("Patient ID:", patient_id)
            print("Result:", result, UNIT_MAP.get(unit_code))
            print("Ref Range:", ref_low, "-", ref_high)

            break