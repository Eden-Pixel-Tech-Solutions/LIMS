#HDC-LYTE PRO
import serial
import re
from datetime import datetime
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.platypus.flowables import HRFlowable

# ==========================================
# SERIAL CONFIGURATION
# ==========================================
PORT = '/dev/tty.usbserial-FTB6SPL3'
BAUD_RATE = 9600

# ==========================================
# CONNECT SERIAL
# ==========================================
ser = serial.Serial(
    port=PORT,
    baudrate=BAUD_RATE,
    bytesize=serial.EIGHTBITS,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    timeout=1
)

print("=" * 60)
print("HDC-LYTE PRO LIS REPORT SYSTEM")
print(f"Connected to {PORT}")
print("=" * 60)

buffer = b""

# ==========================================
# RESULT STORAGE
# ==========================================
report_data = {
    "patient_name": "",
    "patient_id": "",
    "date_time": "",
    "Na": "",
    "K": "",
    "iCa": "",
    "Cl": "",
    "pH": "",
    "Li": ""
}

# ==========================================
# PDF GENERATOR
# ==========================================
def generate_pdf(data):

    filename = f"Electrolyte_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    elements = []

    # ==========================================
    # HOSPITAL HEADER
    # ==========================================
    hospital = Paragraph(
        "<b><font size=18>ABC MULTISPECIALITY HOSPITAL</font></b>",
        styles['Title']
    )

    address = Paragraph(
        "123 Medical College Road, Chennai - 600001<br/>"
        "Phone: +91 9876543210",
        styles['Normal']
    )

    elements.append(hospital)
    elements.append(address)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%"))
    elements.append(Spacer(1, 15))

    # ==========================================
    # PATIENT DETAILS
    # ==========================================
    patient_table = Table([
        ["Patient Name", data["patient_name"]],
        ["Patient ID", data["patient_id"]],
        ["Date & Time", data["date_time"]],
    ], colWidths=[150, 300])

    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(patient_table)
    elements.append(Spacer(1, 20))

    # ==========================================
    # RESULT TABLE
    # ==========================================
    result_data = [
        ["Test", "Result", "Unit", "Reference Range"],
        ["Sodium (Na)", data["Na"], "mmol/L", "135 - 145"],
        ["Potassium (K)", data["K"], "mmol/L", "3.5 - 5.5"],
        ["Ionized Calcium (iCa)", data["iCa"], "mmol/L", "1.10 - 1.35"],
        ["Chloride (Cl)", data["Cl"], "mmol/L", "98 - 107"],
        ["pH", data["pH"], "", "7.35 - 7.45"],
        ["Lithium (Li)", data["Li"], "mmol/L", "NA"],
    ]

    result_table = Table(result_data, colWidths=[180, 100, 100, 120])

    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),

        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),

        ('GRID', (0, 0), (-1, -1), 1, colors.black),

        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),

        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),

        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ]))

    elements.append(result_table)
    elements.append(Spacer(1, 40))

    # ==========================================
    # FOOTER
    # ==========================================
    footer = Paragraph(
        "----- End of Report -----<br/><br/>"
        "Authorized Signature",
        styles['Normal']
    )

    elements.append(footer)

    # ==========================================
    # BUILD PDF
    # ==========================================
    doc.build(elements)

    print(f"\nPDF REPORT GENERATED: {filename}")

# ==========================================
# MAIN LOOP
# ==========================================
while True:

    try:

        data = ser.read(1024)

        if data:

            # Remove ESC formatting bytes
            cleaned = (
                data
                .replace(b'\x1b\x00', b'')
                .replace(b'\x1b', b'')
            )

            text = cleaned.decode(
                'ascii',
                errors='ignore'
            )

            lines = text.splitlines()

            for line in lines:

                line = line.strip()

                if not line:
                    continue

                print("[DATA]", line)

                # ==========================================
                # EXTRACT VALUES
                # ==========================================

                # Date Time
                dt = re.search(r'Date.*time:\s*(.*)', line)
                if dt:
                    report_data["date_time"] = dt.group(1)

                # Patient Name
                name = re.search(r'Name\s*:\s*(.*)', line)
                if name:
                    report_data["patient_name"] = name.group(1)

                # Patient ID
                pid = re.search(r'Patient ID\s*:\s*(.*)', line)
                if pid:
                    report_data["patient_id"] = pid.group(1)

                # Sodium
                na = re.search(r'Na\s*=\s*([\d.]+)', line)
                if na:
                    report_data["Na"] = na.group(1)

                # Potassium
                k = re.search(r'K\s*=\s*([\d.]+)', line)
                if k:
                    report_data["K"] = k.group(1)

                # iCa
                ica = re.search(r'iCa\s*=\s*([\d.]+)', line)
                if ica:
                    report_data["iCa"] = ica.group(1)

                # Chloride
                cl = re.search(r'Cl\s*=\s*([\d.]+)', line)
                if cl:
                    report_data["Cl"] = cl.group(1)

                # pH
                ph = re.search(r'pH\s*=\s*(.*)', line)
                if ph:
                    report_data["pH"] = ph.group(1).strip()

                # Lithium
                li = re.search(r'Li\s*=\s*(.*)', line)
                if li:
                    report_data["Li"] = li.group(1).strip()

                    # ==========================================
                    # FINAL PARAMETER RECEIVED
                    # GENERATE PDF
                    # ==========================================
                    print("\nGenerating PDF Report...\n")

                    generate_pdf(report_data)

                    # Reset for next sample
                    report_data = {
                        "patient_name": "",
                        "patient_id": "",
                        "date_time": "",
                        "Na": "",
                        "K": "",
                        "iCa": "",
                        "Cl": "",
                        "pH": "",
                        "Li": ""
                    }

    except KeyboardInterrupt:

        print("\nProgram Stopped")
        ser.close()
        break

    except Exception as e:

        print("ERROR:", e)