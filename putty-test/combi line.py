import socket
import time

HOST = "0.0.0.0"
PORT = 9527

ACK = b'\x06'
ENQ = b'\x05'
EOT = b'\x04'
STX = b'\x02'
ETX = b'\x03'

# ==========================================
# SERVER
# ==========================================

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server.setsockopt(
    socket.SOL_SOCKET,
    socket.SO_REUSEADDR,
    1
)

server.bind((HOST, PORT))
server.listen(5)

print("=" * 60)
print("ERBA ECL412 ASTM SERVER")
print(f"Listening on {PORT}")
print("=" * 60)

# ==========================================
# MAIN LOOP
# ==========================================

while True:

    conn, addr = server.accept()

    print(f"\nCONNECTED: {addr}")

    session_active = True

    while session_active:

        try:

            data = conn.recv(4096)

            if not data:
                break

            print("\n===================")

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

            # ==================================
            # ENQ
            # ==================================

            if data == ENQ:

                print("\nENQ RECEIVED")

                conn.sendall(ACK)

                print("ACK SENT FOR ENQ")

            # ==================================
            # ASTM FRAME
            # ==================================

            elif data.startswith(STX):

                print("\nSTX FRAME RECEIVED")

                # ACK only after ETX

                if ETX in data:

                    print("COMPLETE FRAME")

                    time.sleep(0.3)

                    conn.sendall(ACK)

                    print("FRAME ACK SENT")

            # ==================================
            # EOT
            # ==================================

            elif data == EOT:

                print("\nEOT RECEIVED")

                # IMPORTANT:
                # Give analyzer time
                # to finish session

                time.sleep(1)

                session_active = False

        except Exception as e:

            print("ERROR:", e)
            break

    # ==========================================
    # GRACEFUL SOCKET CLOSE
    # ==========================================

    try:

        conn.shutdown(socket.SHUT_RDWR)

    except:
        pass

    try:

        conn.close()

    except:
        pass

    print("\nDISCONNECTED")