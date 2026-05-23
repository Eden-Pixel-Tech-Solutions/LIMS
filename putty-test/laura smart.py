import serial

# ==========================================
# SERIAL CONFIGURATION
# ==========================================
PORT = 'COM19'
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
print("LAURA SMART LIS READER")
print(f"Connected to {PORT}")
print(f"Baud Rate: {BAUD_RATE}")
print("=" * 60)

while True:

    try:

        data = ser.read(1024)

        if data:

            print("\nRAW:")
            print(data)

            print("\nTEXT:")
            print(data.decode(
                'ascii',
                errors='ignore'
            ))

            print("-" * 60)

    except KeyboardInterrupt:

        print("\nStopped")
        ser.close()
        break

    except Exception as e:

        print("ERROR:", e)