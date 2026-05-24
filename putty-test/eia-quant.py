import serial

ser = serial.Serial(
    port='/dev/tty.usbserial-FTB6SPL3',
    baudrate=9600,
    bytesize=8,
    parity='N',
    stopbits=1,
    timeout=1
)

print("Meril ASTM Listener Started")

buffer = b''

while True:

    data = ser.read(1024)

    if not data:
        continue

    print("\n========== RAW BYTES ==========")
    print(data)

    try:
        text = data.decode('utf-8', errors='ignore')

        print("\n========== DECODED ==========")
        print(text)

    except Exception as e:
        print(e)