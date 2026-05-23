import serial
import time
import random

# =========================
# FAKE ANALYZER ON COM19
# =========================

PORT = "COM19"
BAUDRATE = 9600

ser = serial.Serial(
    port=PORT,
    baudrate=BAUDRATE,
    bytesize=8,
    parity='N',
    stopbits=1,
    timeout=1
)

print(f"Fake Analyzer Started on {PORT}")

sample_id = 1

while True:

    glucose = random.randint(80, 140)
    cholesterol = random.randint(150, 240)
    hb = round(random.uniform(11.0, 16.5), 1)

    data = f"""
================================
ANALYZER RESULT
Sample ID : {sample_id}
GLU       : {glucose} mg/dL
CHOL      : {cholesterol} mg/dL
HB        : {hb} g/dL
STATUS    : NORMAL
================================
"""

    ser.write(data.encode())

    print("Sent:")
    print(data)

    sample_id += 1

    time.sleep(5)