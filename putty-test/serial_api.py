from flask import Flask, jsonify
from flask_cors import CORS
import serial
import threading

app = Flask(__name__)
CORS(app)

ser = serial.Serial('COM21', 9600)

latest_data = ""
buffer = ""

def read_serial():
    global latest_data, buffer
    print("Reading serial...")

    while True:
        if ser.in_waiting:
            char = ser.read().decode()

            # If Enter pressed → process full message
            if char == '\n' or char == '\r':
                if buffer:
                    print("Received:", buffer)
                    latest_data = buffer

                    reply = "ACK: " + buffer + "\n"
                    ser.write(reply.encode())

                    buffer = ""  # reset
            else:
                buffer += char  # build message

@app.route("/data")
def get_data():
    return jsonify({"value": latest_data})

threading.Thread(target=read_serial, daemon=True).start()

app.run(port=5000)
