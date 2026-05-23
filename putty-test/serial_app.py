import serial
import time

PORT = 'COM19'

BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

def has_valid_frame(data):
    return 0xAA in data and 0xF5 in data

def test_baud(port, baud):
    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(2)

        data = ser.read(100)  # read raw bytes

        if data:
            print(f"Raw ({baud}):", data)

            if has_valid_frame(data):
                print(f"[✓] Valid frame detected at {baud}")
                return ser, baud

        ser.close()

    except Exception as e:
        print(f"[✗] {baud} failed:", e)

    return None, None


print("Scanning baud rates...\n")

ser_conn = None
correct_baud = None

for baud in BAUD_RATES:
    print(f"Trying {baud}...")
    ser, found = test_baud(PORT, baud)

    if ser:
        ser_conn = ser
        correct_baud = found
        break

if ser_conn:
    print(f"\n✅ Connected at {correct_baud}")
    print("Listening for frames...\n")

    buffer = bytearray()

    while True:
        if ser_conn.in_waiting:
            buffer += ser_conn.read(ser_conn.in_waiting)

            # Look for full frame
            if 0xAA in buffer and 0xF5 in buffer:
                start = buffer.index(0xAA)
                end = buffer.index(0xF5)

                frame = buffer[start:end+1]
                print("Frame:", frame)

                buffer = buffer[end+1:]  # remove processed data
else:
    print("\n❌ No valid baud detected")