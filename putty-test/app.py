import serial
import time

# ==========================================
# SERIAL CONFIG
# ==========================================

PORT = "COM19"
BAUD_RATE = 9600

# ASTM CONTROL CHARS

ACK = b'\x06'
ENQ = b'\x05'
EOT = b'\x04'
STX = b'\x02'
ETX = b'\x03'

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
print("STA COMPACT MAX3 ASTM READER")
print(f"PORT      : {PORT}")
print(f"BAUD RATE : {BAUD_RATE}")
print("=" * 60)

# ==========================================
# MAIN LOOP
# ==========================================

while True:

    try:

        data = ser.read(4096)

        if data:

            print("\n========================")

            print("RAW:")
            print(data)

            print("\nHEX:")
            print(data.hex())

            try:

                print("\nASCII:")
                print(data.decode(
                    'ascii',
                    errors='ignore'
                ))

            except:
                pass

            print("\n========================")

            # ==================================
            # ASTM HANDSHAKE
            # ==================================

            # ENQ

            if data == ENQ:

                print("ENQ RECEIVED")

                ser.write(ACK)

                print("ACK SENT")

            # ASTM FRAME

            elif data.startswith(STX):

                print("STX FRAME RECEIVED")

                if ETX in data:

                    time.sleep(0.2)

                    ser.write(ACK)

                    print("FRAME ACK SENT")

            # EOT

            elif data == EOT:

                print("EOT RECEIVED")

    except KeyboardInterrupt:

        print("\nSTOPPED")

        ser.close()

        break

    except Exception as e:

        print("ERROR:", e)