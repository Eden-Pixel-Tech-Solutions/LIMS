"""
Merilyzer CelQuant Edge — CBC Monitor
Simple Tkinter CBC Viewer
NO HISTOGRAMS

Features:
- Case ID
- Code
- Bed No
- Patient Name
- Sex
- Age
- CBC Results
- Serial HL7 Reading

Install:
pip install pyserial
"""

import serial
import threading
import time
from datetime import datetime
import tkinter as tk


# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────

PORT = "/dev/tty.usbserial-FTB6SPL3"   # Windows Example: COM19
BAUD = 115200
TIMEOUT = 1

BG      = "#0d1117"
BG2     = "#161b22"
BG3     = "#21262d"

ACCENT  = "#1f6feb"

GREEN   = "#3fb950"
RED     = "#f85149"
BLUE    = "#58a6ff"
YELLOW  = "#d29922"

WHITE   = "#e6edf3"
DIM     = "#8b949e"


# ─────────────────────────────────────────────────────────────
# HL7 PARSER
# ─────────────────────────────────────────────────────────────

def parse_hl7(raw: str):

    result = {
        "case_id": "",
        "code": "",
        "bed_no": "",
        "name": "",
        "sex": "",
        "age": "",
        "age_unit": "",
        "mode": "",
        "test_mode": "",
        "timestamp": None,
    }

    CBC_PARAMS = [
        "WBC", "Lymph#", "Mid#", "Gran#",
        "Lymph%", "Mid%", "Gran%",
        "RBC", "HGB", "HCT", "MCV",
        "MCH", "MCHC", "RDW-CV", "RDW-SD",
        "PLT", "MPV", "PDW", "PCT",
        "P-LCC", "P-LCR"
    ]

    for p in CBC_PARAMS:
        result[p] = None

    CODE_MAP = {
        "6690-2": "WBC",
        "731-0": "Lymph#",
        "10027": "Mid#",
        "10028": "Gran#",
        "736-9": "Lymph%",
        "10029": "Mid%",
        "10030": "Gran%",
        "789-8": "RBC",
        "718-7": "HGB",
        "4544-3": "HCT",
        "787-2": "MCV",
        "785-6": "MCH",
        "786-4": "MCHC",
        "788-0": "RDW-CV",
        "70-5": "RDW-SD",
        "21000-5": "RDW-SD",
        "777-3": "PLT",
        "32623-1": "MPV",
        "32207-3": "PDW",
        "10002": "PCT",
        "10013": "P-LCC",
        "10014": "P-LCR",
    }

    LABEL_MAP = {
        "wbc": "WBC",
        "lymph#": "Lymph#",
        "lym#": "Lymph#",
        "mid#": "Mid#",
        "gran#": "Gran#",
        "lymph%": "Lymph%",
        "lym%": "Lymph%",
        "mid%": "Mid%",
        "gran%": "Gran%",
        "rbc": "RBC",
        "hgb": "HGB",
        "hb": "HGB",
        "hct": "HCT",
        "mcv": "MCV",
        "mch": "MCH",
        "mchc": "MCHC",
        "rdw-cv": "RDW-CV",
        "rdw-sd": "RDW-SD",
        "plt": "PLT",
        "mpv": "MPV",
        "pdw": "PDW",
        "pct": "PCT",
        "p-lcc": "P-LCC",
        "p-lcr": "P-LCR",
    }

    raw = raw.replace("\r\n", "\n").replace("\r", "\n")

    lines = raw.split("\n")

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # ─────────────────────────────
        # MSH
        # ─────────────────────────────

        if line.startswith("MSH|"):

            fields = line.split("|")

            if len(fields) > 6:

                try:
                    result["timestamp"] = datetime.strptime(
                        fields[6][:14],
                        "%Y%m%d%H%M%S"
                    )
                except:
                    pass

        # ─────────────────────────────
        # PID
        # ─────────────────────────────

        if line.startswith("PID|"):

            fields = line.split("|")

            # NAME
            if len(fields) > 5:

                name_field = fields[5].split("^")

                if len(name_field) > 0:

                    result["name"] = " ".join(
                        [x for x in name_field if x.strip()]
                    )

            # SEX
            if len(fields) > 8:

                sex = fields[8].strip().upper()

                result["sex"] = {
                    "M": "Male",
                    "F": "Female",
                    "U": "Unknown"
                }.get(sex, sex)

            # AGE / DOB
            if len(fields) > 7:

                dob = fields[7].strip()

                if len(dob) >= 8:

                    try:

                        birth = datetime.strptime(
                            dob[:8],
                            "%Y%m%d"
                        )

                        today = datetime.now()

                        age = today.year - birth.year

                        if (
                            (today.month, today.day)
                            <
                            (birth.month, birth.day)
                        ):
                            age -= 1

                        result["age"] = str(age)
                        result["age_unit"] = "yr"

                    except:
                        pass

        # ─────────────────────────────
        # OBR
        # ─────────────────────────────

        if line.startswith("OBR|"):

            print("\nOBR RAW:", line)

            fields = line.split("|")

            # CASE ID
            if len(fields) > 2:

                result["case_id"] = (
                    fields[2]
                    .split("^")[0]
                    .strip()
                )

            # CODE
            if len(fields) > 3:

                result["code"] = (
                    fields[3]
                    .split("^")[0]
                    .strip()
                )

            # BED NO
            if len(fields) > 18:

                result["bed_no"] = (
                    fields[18]
                    .split("^")[0]
                    .strip()
                )

        # ─────────────────────────────
        # OBX
        # ─────────────────────────────

        if not line.startswith("OBX|"):
            continue

        fields = line.split("|")

        if len(fields) < 6:
            continue

        obx_type = fields[2].strip()

        # Ignore histogram binary
        if obx_type == "ED":
            continue

        id_field = fields[3].strip()

        value = fields[5].strip()

        unit = fields[6].strip() if len(fields) > 6 else ""

        ref_range = fields[7].strip() if len(fields) > 7 else ""

        flag = fields[8].strip() if len(fields) > 8 else ""

        id_parts = id_field.split("^")

        code = id_parts[0].strip()

        label = ""

        if len(id_parts) > 1:
            label = id_parts[1].strip().lower()

        # MODE
        if "08001" in code:

            result["mode"] = {
                "O": "Whole Blood",
                "C": "Capillary",
                "P": "Pre-diluted"
            }.get(value, value)

            continue

        # TEST MODE
        if "08003" in code:

            result["test_mode"] = {
                "W": "CBC+Diff",
                "C": "CBC",
                "D": "Diff"
            }.get(value, value)

            continue

        # AGE
        if "age" in label:

            result["age"] = value
            result["age_unit"] = unit

            continue

        # Skip invalid numeric values
        if not value:
            continue

        try:
            float(value)
        except:
            continue

        param_name = None

        # Match by code
        for mc, pn in CODE_MAP.items():

            if code == mc or code.startswith(mc):

                param_name = pn
                break

        # Match by label
        if param_name is None:

            clean_label = label.replace(" ", "")

            param_name = LABEL_MAP.get(clean_label)

        if param_name is None:
            continue

        # HCT / MCV fix
        if "787-2" in code:

            if "hct" in label:
                param_name = "HCT"
            else:
                param_name = "MCV"

        result[param_name] = {
            "value": value,
            "unit": unit,
            "range": ref_range,
            "flag": flag
        }

    return result


# ─────────────────────────────────────────────────────────────
# GUI
# ─────────────────────────────────────────────────────────────

class CBCMonitor:

    def __init__(self, root):

        self.root = root

        self.root.title("Merilyzer CelQuant Edge — CBC Monitor")

        self.root.geometry("1200x900")

        self.root.configure(bg=BG)

        self.build_ui()

        self.start_serial()

    # ─────────────────────────────────

    def build_ui(self):

        # HEADER
        header = tk.Frame(
            self.root,
            bg=BG2,
            height=60
        )

        header.pack(fill="x")

        tk.Label(
            header,
            text="MERILYZER CelQuant Edge — CBC Monitor",
            bg=BG2,
            fg=WHITE,
            font=("Courier New", 18, "bold")
        ).pack(side="left", padx=18, pady=14)

        self.status_lbl = tk.Label(
            header,
            text="Waiting for analyzer...",
            bg=BG2,
            fg=YELLOW,
            font=("Courier New", 10)
        )

        self.status_lbl.pack(side="right", padx=20)

        # MAIN
        main = tk.Frame(
            self.root,
            bg=BG
        )

        main.pack(
            fill="both",
            expand=True,
            padx=10,
            pady=10
        )

        # PATIENT INFO
        info = tk.LabelFrame(
            main,
            text=" Patient Information ",
            bg=BG2,
            fg=ACCENT,
            font=("Courier New", 10, "bold")
        )

        info.pack(fill="x", pady=(0, 12))

        self.info_vars = {}

        fields = [
            "Case ID",
            "Code",
            "Bed No",
            "Name",
            "Sex",
            "Age",
            "Time",
            "Mode",
            "Test Mode"
        ]

        for i, field in enumerate(fields):

            tk.Label(
                info,
                text=field,
                bg=BG2,
                fg=DIM,
                font=("Courier New", 11),
                width=14,
                anchor="w"
            ).grid(
                row=i,
                column=0,
                sticky="w",
                padx=12,
                pady=5
            )

            var = tk.StringVar(value="—")

            self.info_vars[field] = var

            tk.Label(
                info,
                textvariable=var,
                bg=BG2,
                fg=WHITE,
                font=("Courier New", 11, "bold"),
                anchor="w"
            ).grid(
                row=i,
                column=1,
                sticky="w",
                padx=10
            )

        # CBC TABLE
        table = tk.Frame(main, bg=BG)

        table.pack(fill="both", expand=True)

        headers = [
            ("Parameter", 18),
            ("Result", 12),
            ("Flag", 8),
            ("Unit", 14),
            ("Reference", 18),
        ]

        for c, (txt, width) in enumerate(headers):

            tk.Label(
                table,
                text=txt,
                bg=ACCENT,
                fg=WHITE,
                font=("Courier New", 11, "bold"),
                width=width,
                pady=6
            ).grid(
                row=0,
                column=c,
                padx=1,
                pady=1
            )

        params = [
            "WBC", "Lymph#", "Mid#", "Gran#",
            "Lymph%", "Mid%", "Gran%",
            "RBC", "HGB", "HCT", "MCV",
            "MCH", "MCHC", "RDW-CV", "RDW-SD",
            "PLT", "MPV", "PDW", "PCT",
            "P-LCC", "P-LCR"
        ]

        self.rows = {}

        for i, param in enumerate(params, start=1):

            bgc = BG3 if i % 2 else BG2

            row = {}

            tk.Label(
                table,
                text=param,
                bg=bgc,
                fg=WHITE,
                font=("Courier New", 11),
                width=18,
                anchor="w",
                pady=5
            ).grid(
                row=i,
                column=0,
                padx=1,
                pady=1
            )

            for col in range(1, 5):

                var = tk.StringVar(value="—")

                lbl = tk.Label(
                    table,
                    textvariable=var,
                    bg=bgc,
                    fg=WHITE,
                    font=("Courier New", 11),
                    width=headers[col][1],
                    pady=5
                )

                lbl.grid(
                    row=i,
                    column=col,
                    padx=1,
                    pady=1
                )

                row[col] = var

                if col == 1:
                    row["value_lbl"] = lbl

            self.rows[param] = row

    # ─────────────────────────────────

    def update_ui(self, data):

        ts = data.get("timestamp")

        ts_str = "—"

        if ts:
            ts_str = ts.strftime("%d-%m-%Y %H:%M:%S")

        age_str = "—"

        if data.get("age"):
            age_str = f"{data['age']} {data['age_unit']}"

        info_data = {
            "Case ID": data.get("case_id") or "—",
            "Code": data.get("code") or "—",
            "Bed No": data.get("bed_no") or "—",
            "Name": data.get("name") or "—",
            "Sex": data.get("sex") or "—",
            "Age": age_str,
            "Time": ts_str,
            "Mode": data.get("mode") or "—",
            "Test Mode": data.get("test_mode") or "—",
        }

        for k, v in info_data.items():
            self.info_vars[k].set(v)

        # TABLE UPDATE
        for param, row in self.rows.items():

            info = data.get(param)

            if info is None:

                row[1].set("—")
                row[2].set("")
                row[3].set("")
                row[4].set("")

                row["value_lbl"].config(fg=DIM)

                continue

            value = info.get("value", "")
            flag = info.get("flag", "")
            unit = info.get("unit", "")
            ref  = info.get("range", "")

            row[1].set(value)
            row[2].set(flag if flag else "N")
            row[3].set(unit)
            row[4].set(ref)

            color = GREEN

            if "H" in flag.upper():
                color = RED

            elif "L" in flag.upper():
                color = BLUE

            row["value_lbl"].config(fg=color)

        self.status_lbl.config(
            text="Sample received successfully",
            fg=GREEN
        )

    # ─────────────────────────────────

    def start_serial(self):

        threading.Thread(
            target=self.serial_loop,
            daemon=True
        ).start()

    # ─────────────────────────────────

    def serial_loop(self):

        try:

            ser = serial.Serial(
                PORT,
                BAUD,
                timeout=TIMEOUT
            )

        except Exception as e:

            self.root.after(
                0,
                lambda: self.status_lbl.config(
                    text=f"Connection Error: {e}",
                    fg=RED
                )
            )

            return

        self.root.after(
            0,
            lambda: self.status_lbl.config(
                text=f"Connected to {PORT}",
                fg=GREEN
            )
        )

        buffer = ""

        while True:

            try:

                if ser.in_waiting:

                    buffer += ser.read(
                        ser.in_waiting
                    ).decode(errors="ignore")

                # COMPLETE HL7 MESSAGE
                if (
                    "MSH|" in buffer and
                    "OBX|" in buffer and
                    buffer.rstrip().endswith("F")
                ):

                    time.sleep(0.3)

                    if ser.in_waiting:

                        buffer += ser.read(
                            ser.in_waiting
                        ).decode(errors="ignore")

                    parsed = parse_hl7(buffer)

                    self.root.after(
                        0,
                        lambda r=parsed: self.update_ui(r)
                    )

                    buffer = ""

                # Safety reset
                if len(buffer) > 100000:
                    buffer = ""

                time.sleep(0.05)

            except Exception as e:

                err = str(e)

                self.root.after(
                    0,
                    lambda: self.status_lbl.config(
                        text=f"Serial Error: {err}",
                        fg=RED
                    )
                )

                time.sleep(2)


# ─────────────────────────────────────────────────────────────
# ENTRY
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":

    root = tk.Tk()

    app = CBCMonitor(root)

    root.mainloop()