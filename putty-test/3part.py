"""
Merilyzer CelQuant Edge — CBC GUI with Live Histograms
Requires: pip install pyserial matplotlib
"""

import serial
import sys
import os
import time
import threading
import binascii
from datetime import datetime
import tkinter as tk
from tkinter import ttk
import matplotlib
matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import numpy as np

# ── CONFIG ────────────────────────────────────────────────────────────────────
PORT    = "/dev/tty.usbserial-310"
BAUD    = 115200
TIMEOUT = 1


BG      = "#0d1117"
BG2     = "#161b22"
BG3     = "#21262d"
ACCENT  = "#1f6feb"
GREEN   = "#3fb950"
RED     = "#f85149"
YELLOW  = "#d29922"
BLUE    = "#58a6ff"
DIM     = "#8b949e"
WHITE   = "#e6edf3"
BORDER  = "#30363d"
# ─────────────────────────────────────────────────────────────────────────────


# ── HL7 PARSER ────────────────────────────────────────────────────────────────

def parse_hl7(raw: str) -> dict:
    result = {
        "code": "", "name": "", "sex": "", "age": "",
        "age_unit": "", "mode": "", "test_mode": "", "timestamp": None,
        "WBC":    None, "Lymph#": None, "Mid#":   None, "Gran#":  None,
        "Lymph%": None, "Mid%":   None, "Gran%":  None,
        "RBC":    None, "HGB":    None, "HCT":    None, "MCV":    None,
        "MCH":    None, "MCHC":   None, "RDW-CV": None, "RDW-SD": None,
        "PLT":    None, "MPV":    None, "PDW":    None, "PCT":    None,
        "P-LCC":  None, "P-LCR":  None,
        "hist_wbc": [], "hist_rbc": [], "hist_plt": [],
        "wbc_lym_left": None, "wbc_lym_mid": None, "wbc_gran_right": None,
        "rbc_left": None,     "rbc_right":   None,
        "plt_left": None,     "plt_right":   None,
    }

    CODE_MAP = {
        "6690-2":"WBC",    "731-0":"Lymph#",  "10027":"Mid#",
        "10028":"Gran#",   "736-9":"Lymph%",  "10029":"Mid%",
        "10030":"Gran%",   "789-8":"RBC",     "718-7":"HGB",
        "4544-3":"HCT",   "785-6":"MCH",     "786-4":"MCHC",
        "788-0":"RDW-CV", "70-5":"RDW-SD",   "21000-5":"RDW-SD",
        "777-3":"PLT",    "32623-1":"MPV",   "32207-3":"PDW",
        "10002":"PCT",    "10013":"P-LCC",   "10014":"P-LCR",
    }
    LABEL_MAP = {
        "wbc":"WBC","lymph#":"Lymph#","lym#":"Lymph#","mid#":"Mid#",
        "gran#":"Gran#","lymph%":"Lymph%","lym%":"Lymph%","mid%":"Mid%",
        "gran%":"Gran%","rbc":"RBC","hgb":"HGB","hb":"HGB","hct":"HCT",
        "mcv":"MCV","mch":"MCH","mchc":"MCHC","rdw-cv":"RDW-CV",
        "rdw-sd":"RDW-SD","plt":"PLT","mpv":"MPV","pdw":"PDW","pct":"PCT",
        "p-lcc":"P-LCC","p-lcr":"P-LCR",
    }

    raw = raw.replace("\r\n", "\n").replace("\r", "\n")
    # Fix broken HL7 lines that start with a component separator
    raw = raw.replace("\n^", "^")
    lines = raw.split("\n")
    in_hist_wbc = in_hist_rbc = in_hist_plt = False
    hex_accum = ""

    def flush_hist(channel):
        nonlocal hex_accum
        h = hex_accum.replace(" ", "").replace("\n", "")
        try:
            result[channel] = list(binascii.unhexlify(h))
        except Exception:
            result[channel] = []
        hex_accum = ""

    for line in lines:
        line_s = line.strip()

        # ── Accumulate histogram hex across wrapped lines
        if in_hist_wbc or in_hist_rbc or in_hist_plt:
            if line_s.startswith(("OBX|","MSH|","OBR|","PID|")):
                ch = "hist_wbc" if in_hist_wbc else ("hist_rbc" if in_hist_rbc else "hist_plt")
                flush_hist(ch)
                in_hist_wbc = in_hist_rbc = in_hist_plt = False
                # fall through — parse this line normally
            else:
                hex_accum += line_s
                continue

        if not line_s:
            continue

        # ── MSH timestamp (field index 7 = message datetime)
        if line_s.startswith("MSH|"):
            f = line_s.split("|")
            # MSH fields: [0]=MSH [1]=encoding [2]=sending app [3]=facility
            #             [4]=recv app [5]=recv fac [6]=datetime [7]=security
            # datetime is at index 6
            if len(f) > 6:
                try:
                    result["timestamp"] = datetime.strptime(f[6].strip()[:14], "%Y%m%d%H%M%S")
                except Exception:
                    pass

        # ── OBR — patient demographics
        # Layout from your data:
        # OBR|13||2|00001^^sandeep|||M
        # idx:  1  2 3    4          7
        #  [1]=seq [2]=blank [3]=filler_order_num [4]=universal_service_id
        #  [7]=observation_datetime  -- BUT in this firmware sex is at [7]
        #
        # Your actual OBR (two physical lines joined):
        # OBR|13||2|00001^^sandeep|||M\n^Automated Count^99MRC|||20260503162329|||steve
        # After join fields[7] may be "M\n^Automated..." → split on \n
        if line_s.startswith("OBR|"):
            fields = line_s.split("|")

            if len(fields) > 4:
                parts = fields[4].split("^")

                # Code
                result["code"] = parts[0] if len(parts) > 0 else ""

                # Name (IMPORTANT FIX)
                if len(parts) > 2 and parts[2].strip():
                    result["name"] = parts[2].strip()
                elif len(parts) > 1 and parts[1].strip():
                    result["name"] = parts[1].strip()

            # field[7] in this firmware = sex character (M/F/U)
            # After joining broken lines, field[7] might be "M^Automated..."
            if len(fields) > 7:
                sx_part = fields[7].strip()
                # If joined, it might have components, take the first one
                sx = sx_part.split("^")[0].strip().upper()
                if sx in ("M", "F", "U"):
                    result["sex"] = {"M": "Male", "F": "Female", "U": "Unknown"}[sx]

            # observation time — look in subsequent fields for a 14-digit timestamp
            for fi in fields[7:]:
                fi_clean = fi.strip().replace("^", "") # clean components if any
                if len(fi_clean) >= 14 and fi_clean[:14].isdigit() and result["timestamp"] is None:
                    try:
                        result["timestamp"] = datetime.strptime(fi_clean[:14], "%Y%m%d%H%M%S")
                        break
                    except Exception:
                        pass

        # ── OBX
        if not line_s.startswith("OBX|"):
            continue

        f = line_s.split("|")
        if len(f) < 4:
            continue

        obx_type  = f[2].strip() if len(f) > 2 else ""
        id_field  = f[3].strip() if len(f) > 3 else ""
        value_raw = f[5].strip() if len(f) > 5 else ""
        unit_raw  = f[6].strip() if len(f) > 6 else ""
        range_raw = f[7].strip() if len(f) > 7 else ""
        flag_raw  = f[8].strip() if len(f) > 8 else ""

        id_parts  = id_field.split("^")
        code      = id_parts[0].strip()
        label_hl7 = id_parts[1].strip() if len(id_parts) > 1 else ""
        label_low = label_hl7.lower()

        # ── Histogram Binary — start hex accumulation
        if obx_type == "ED" or "Binary" in label_hl7:
            if "15000" in code or ("WBC" in label_hl7 and "Binary" in label_hl7):
                in_hist_wbc = True
            elif "15050" in code or ("RBC" in label_hl7 and "Binary" in label_hl7):
                in_hist_rbc = True
            elif "15100" in code or ("PLT" in label_hl7 and "Binary" in label_hl7):
                in_hist_plt = True
            # grab hex after Octer-stream^
            marker = "Octer-stream^"
            idx = line_s.find(marker)
            if idx != -1:
                hex_accum = line_s[idx + len(marker):]
            continue

        # ── Histogram boundary lines
        if "15010" in code or "Lym left line" in label_hl7:
            try: result["wbc_lym_left"]   = int(value_raw)
            except: pass
            continue
        if "15011" in code or "Lym M" in label_hl7:
            try: result["wbc_lym_mid"]    = int(value_raw)
            except: pass
            continue
        if "15012" in code or "Mid Gran line" in label_hl7:
            try: result["wbc_lym_mid"]    = int(value_raw)   # mid boundary
            except: pass
            continue
        if "15013" in code or "Gran right" in label_hl7:
            try: result["wbc_gran_right"] = int(value_raw)
            except: pass
            continue
        if "15051" in code or "RBC Histogram Left" in label_hl7:
            try: result["rbc_left"]  = int(value_raw)
            except: pass
            continue
        if "15052" in code or "RBC H" in label_hl7:
            try: result["rbc_right"] = int(value_raw)
            except: pass
            continue
        if "15111" in code or "PLT Histogram Left" in label_hl7:
            try: result["plt_left"]  = int(value_raw)
            except: pass
            continue
        if "15112" in code or "PLT Histogram Right" in label_hl7:
            try: result["plt_right"] = int(value_raw)
            except: pass
            continue

        # ── Skip alert / flag-only rows
        skip_kw = ["histogram","region alert","multiple alert","boundary",
                   "lym left","lym mid","gran right","wbc lym","wbc mid",
                   "wbc gran","mid gran","rbc h"]
        if any(k in label_low for k in skip_kw):
            continue

        # ── Age  (OBX|6 ST|01001^Remge → value=20, unit=yr)
        if code in ("30525-0","01001") or "age" in label_low or "remge" in label_low:
            if value_raw and value_raw not in ("F","T","O","W","Common","CBC","Remark",""):
                try:
                    float(value_raw)
                    result["age"]      = value_raw
                    result["age_unit"] = unit_raw
                except ValueError:
                    pass
            continue

        # ── Blood / Take Mode  (O=Whole Blood, C=Capillary, P=Pre-diluted)
        if "08001" in code or "take mode" in label_low:
            result["mode"] = {"O":"Whole Blood","C":"Capillary","P":"Pre-diluted"}.get(
                value_raw, value_raw)
            continue

        # ── Test Mode  (W=CBC+WBC Diff, C=CBC Only)
        if "08003" in code or "test mode" in label_low:
            result["test_mode"] = {"W":"CBC+WBC Diff","C":"CBC Only","D":"WBC Diff Only"}.get(
                value_raw, value_raw)
            continue

        # ── Sex from OBX if not already set
        if "08002" in code and not result["sex"]:
            result["sex"] = {"M":"Male","F":"Female","U":"Unknown"}.get(
                value_raw.upper(), value_raw)
            continue

        # ── Numeric CBC values
        if not value_raw or "*" in value_raw:
            continue
        try:
            float(value_raw)
        except ValueError:
            continue

        # Resolve parameter name — by code first
        param_name = None
        for mc, pn in CODE_MAP.items():
            if code == mc or code.startswith(mc):
                param_name = pn
                break
        # garbled code fallback
        if param_name is None and "gran" in code.lower():
            param_name = "Gran#"
        # label fallback
        if param_name is None:
            param_name = LABEL_MAP.get(label_low.replace(" ",""))
        if param_name is None:
            continue

        # 787-2 is MCV in LOINC but some firmware uses it for HCT
        if "787-2" in code:
            param_name = "HCT" if "hct" in label_low else "MCV"

        if result.get(param_name) is not None:
            continue   # keep first value seen

        result[param_name] = {
            "value": value_raw, "unit":  unit_raw,
            "range": range_raw, "flag":  flag_raw,
        }

    # flush any trailing histogram
    if in_hist_wbc: flush_hist("hist_wbc")
    if in_hist_rbc: flush_hist("hist_rbc")
    if in_hist_plt: flush_hist("hist_plt")

    return result


# ── GUI ───────────────────────────────────────────────────────────────────────

class MerilyzerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Merilyzer CelQuant Edge — CBC Monitor")
        self.root.configure(bg=BG)
        self.root.geometry("1300x840")
        self.root.minsize(1100, 720)
        self._build_ui()
        self._start_serial()

    # ── UI ────────────────────────────────────────────────────────────────────

    def _build_ui(self):
        # Title bar
        hdr = tk.Frame(self.root, bg=BG2, height=52)
        hdr.pack(fill="x", side="top")
        tk.Label(hdr, text="⬡  MERILYZER CelQuant Edge  ·  CBC Monitor",
                 bg=BG2, fg=WHITE, font=("Courier New", 15, "bold"),
                 pady=12).pack(side="left", padx=20)
        self.lbl_status = tk.Label(hdr, text="● Waiting for analyzer…",
                                   bg=BG2, fg=YELLOW, font=("Courier New", 10))
        self.lbl_status.pack(side="right", padx=20)

        body = tk.Frame(self.root, bg=BG)
        body.pack(fill="both", expand=True, padx=10, pady=8)

        # Left panel (fixed width)
        left = tk.Frame(body, bg=BG, width=430)
        left.pack(side="left", fill="y", padx=(0, 6))
        left.pack_propagate(False)
        self._build_info_panel(left)
        self._build_cbc_table(left)

        # Right panel — histograms
        right = tk.Frame(body, bg=BG)
        right.pack(side="left", fill="both", expand=True)
        self._build_histogram_panel(right)

    def _build_info_panel(self, parent):
        frm = tk.LabelFrame(parent, text=" Patient / Sample ",
                             bg=BG2, fg=ACCENT, font=("Courier New", 10, "bold"),
                             bd=1, relief="solid")
        frm.pack(fill="x", pady=(0, 6))

        self.info_vars = {}
        for i, (k, default) in enumerate([
            ("Code", "—"), ("Name", "—"), ("Sex",  "—"), ("Age",  "—"),
            ("Time", "—"), ("Mode", "—"), ("Test Mode", "—"),
        ]):
            tk.Label(frm, text=f"  {k}", bg=BG2, fg=DIM,
                     font=("Courier New", 10), anchor="w", width=11
                     ).grid(row=i, column=0, sticky="w", pady=2)
            var = tk.StringVar(value=default)
            self.info_vars[k] = var
            tk.Label(frm, textvariable=var, bg=BG2, fg=WHITE,
                     font=("Courier New", 10, "bold"), anchor="w"
                     ).grid(row=i, column=1, sticky="w", padx=(4, 8))

    def _build_cbc_table(self, parent):
        frm = tk.Frame(parent, bg=BG2, bd=1, relief="solid")
        frm.pack(fill="both", expand=True)

        # Header
        for ci, (txt, w) in enumerate([("Parameter",13),("Result",9),
                                        ("Flag",6),("Unit",10),("Ref Range",13)]):
            tk.Label(frm, text=txt, bg=BG3, fg=DIM,
                     font=("Courier New", 9, "bold"),
                     width=w, anchor="center", pady=4
                     ).grid(row=0, column=ci, sticky="ew", padx=1)

        self.table_rows = {}
        SECTIONS = [
            ("WBC Panel",  ["WBC"]),
            ("WBC Diff",   ["Lymph#","Mid#","Gran#","Lymph%","Mid%","Gran%"]),
            ("RBC",        ["RBC"]),
            ("RBC Panel",  ["HGB","HCT","MCV","MCH","MCHC","RDW-CV","RDW-SD"]),
            ("Platelets",  ["PLT","MPV","PDW","PCT","P-LCC","P-LCR"]),
        ]
        ri = 1
        for sec, params in SECTIONS:
            tk.Label(frm, text=f"  {sec}", bg=ACCENT, fg=WHITE,
                     font=("Courier New", 9, "bold"),
                     anchor="w", pady=2
                     ).grid(row=ri, column=0, columnspan=5, sticky="ew", padx=1)
            ri += 1
            for p in params:
                bg_row = BG2 if ri % 2 == 0 else BG3
                vars_ = {}
                specs = [(p,13,"w"),("—",9,"center"),("",6,"center"),("",10,"center"),("",13,"center")]
                for ci, (txt, w, anch) in enumerate(specs):
                    var = tk.StringVar(value=txt)
                    vars_[ci] = var
                    lbl = tk.Label(frm, textvariable=var, bg=bg_row, fg=WHITE,
                                   font=("Courier New", 9), width=w,
                                   anchor=anch, pady=3)
                    lbl.grid(row=ri, column=ci, sticky="ew", padx=1)
                    if ci == 1: vars_["val_lbl"]  = lbl
                    if ci == 2: vars_["flag_lbl"] = lbl
                self.table_rows[p] = vars_
                ri += 1

    def _build_histogram_panel(self, parent):
        tk.Label(parent, text="  HISTOGRAMS", bg=BG, fg=DIM,
                 font=("Courier New", 10, "bold"), anchor="w").pack(fill="x")

        self.fig = Figure(figsize=(7, 7.8), facecolor=BG)
        self.fig.subplots_adjust(hspace=0.48, left=0.08, right=0.97,
                                  top=0.94, bottom=0.06)
        self.ax_wbc = self.fig.add_subplot(3, 1, 1)
        self.ax_rbc = self.fig.add_subplot(3, 1, 2)
        self.ax_plt = self.fig.add_subplot(3, 1, 3)

        for ax, t in [(self.ax_wbc,"WBC Histogram"),
                      (self.ax_rbc,"RBC Histogram"),
                      (self.ax_plt,"PLT Histogram")]:
            self._style_ax(ax, t)

        self.canvas = FigureCanvasTkAgg(self.fig, master=parent)
        self.canvas.get_tk_widget().pack(fill="both", expand=True)
        self._draw_empty()

    def _style_ax(self, ax, title):
        ax.set_facecolor(BG3)
        ax.tick_params(colors=DIM, labelsize=7)
        ax.set_title(title, color=WHITE, fontsize=10, fontweight="bold", pad=4)
        for sp in ax.spines.values():
            sp.set_color(BORDER); sp.set_linewidth(0.5)

    def _draw_empty(self):
        for ax, t in [(self.ax_wbc,"WBC Histogram"),
                      (self.ax_rbc,"RBC Histogram"),
                      (self.ax_plt,"PLT Histogram")]:
            ax.clear(); self._style_ax(ax, t)
            ax.text(0.5, 0.5, "Waiting for data…",
                    transform=ax.transAxes,
                    ha="center", va="center", color=DIM, fontsize=9)
        self.canvas.draw()

    # ── Update ────────────────────────────────────────────────────────────────

    def update(self, r: dict):
        # Patient info
        ts     = r.get("timestamp")
        ts_str = ts.strftime("%d %b %Y  %H:%M:%S") if ts else "—"
        age_str = f"{r['age']} {r['age_unit']}".strip() if r.get("age") else "—"
        name_str = r.get("name") or "—"
        sex_str  = r.get("sex")  or "—"
        code_str = r.get("code") or "—"
        mode_str = r.get("mode") or "—"
        test_str = r.get("test_mode") or "—"

        for k, v in [("Code",code_str),("Name",name_str),("Sex",sex_str),
                     ("Age",age_str),("Time",ts_str),
                     ("Mode",mode_str),("Test Mode",test_str)]:
            self.info_vars[k].set(v)

        # CBC table
        for param, rv in self.table_rows.items():
            info = r.get(param)
            if info is None:
                rv[1].set("—"); rv[2].set(""); rv[3].set(""); rv[4].set("")
                rv["val_lbl"].config(fg=DIM); rv["flag_lbl"].config(fg=DIM)
            else:
                val  = info.get("value","—")
                flag = info.get("flag","").upper()
                unit = info.get("unit","")
                rng  = info.get("range","")
                rv[1].set(val)
                rv[2].set(flag if flag else "N")
                rv[3].set(unit); rv[4].set(rng)
                fc = RED if "H" in flag else (BLUE if "L" in flag else GREEN)
                rv["val_lbl"].config(fg=fc)
                rv["flag_lbl"].config(fg=fc)

        # Histograms
        self._draw_hist(self.ax_wbc, r["hist_wbc"], "WBC Histogram", ACCENT,
                        [r["wbc_lym_left"], r["wbc_lym_mid"], r["wbc_gran_right"]],
                        ["Lymph", "Mid", "Gran"])
        self._draw_hist(self.ax_rbc, r["hist_rbc"], "RBC Histogram", GREEN,
                        [r["rbc_left"], r["rbc_right"]], [])
        self._draw_hist(self.ax_plt, r["hist_plt"], "PLT Histogram", YELLOW,
                        [r["plt_left"], r["plt_right"]], [])
        self.canvas.draw()
        self.lbl_status.config(text="● Sample received", fg=GREEN)

    def _draw_hist(self, ax, data, title, color, boundaries, region_labels):
        ax.clear()
        self._style_ax(ax, title)

        if not data or all(v == 0 for v in data):
            ax.text(0.5, 0.5, "No signal  (all zeros — run a blood sample)",
                    transform=ax.transAxes,
                    ha="center", va="center", color=DIM, fontsize=8)
            return

        y = np.array(data, dtype=float)
        x = np.arange(len(y))

        # Light smoothing
        kernel = np.ones(3) / 3
        y_s = np.convolve(y, kernel, mode="same")

        ax.fill_between(x, y_s, alpha=0.3, color=color)
        ax.plot(x, y_s, color=color, linewidth=1.6)
        ax.set_xlim(0, len(y) - 1)
        ax.set_ylim(0, max(y_s.max() * 1.18, 1))

        # Boundary lines + region labels
        line_colors = ["#f0883e", "#a371f7", "#58a6ff", "#3fb950"]
        valid_bounds = [(i, b) for i, b in enumerate(boundaries) if b is not None]
        prev_x = 0
        for idx, (bi, bv) in enumerate(valid_bounds):
            lc = line_colors[idx % len(line_colors)]
            ax.axvline(x=bv, color=lc, linewidth=1.3, linestyle="--", alpha=0.85)
            if idx < len(region_labels):
                mid = (prev_x + bv) / 2.0
                rel = mid / max(len(y) - 1, 1)
                ax.text(rel, 0.87, region_labels[idx],
                        transform=ax.transAxes,
                        color=lc, fontsize=7, ha="center", va="top")
            prev_x = bv
        # Last region label (after final boundary)
        if valid_bounds and len(region_labels) > len(valid_bounds):
            last_bv = valid_bounds[-1][1]
            mid = (last_bv + len(y)) / 2.0
            rel = mid / max(len(y) - 1, 1)
            lc = line_colors[len(valid_bounds) % len(line_colors)]
            ax.text(rel, 0.87, region_labels[len(valid_bounds)],
                    transform=ax.transAxes,
                    color=lc, fontsize=7, ha="center", va="top")

    # ── Serial thread ─────────────────────────────────────────────────────────

    def _start_serial(self):
        threading.Thread(target=self._serial_loop, daemon=True).start()

    def _serial_loop(self):
        try:
            ser = serial.Serial(PORT, BAUD, timeout=TIMEOUT)
        except serial.SerialException as e:
            self.root.after(0, lambda: self.lbl_status.config(
                text=f"● ERROR: {e}", fg=RED))
            return

        self.root.after(0, lambda: self.lbl_status.config(
            text=f"● Connected  {PORT}  {BAUD} baud", fg=GREEN))

        buffer = ""
        while True:
            try:
                if ser.in_waiting:
                    buffer += ser.read(ser.in_waiting).decode(errors="ignore")

                if ("MSH|" in buffer and "OBX|" in buffer and
                        ("PLT Histogram Binary" in buffer or "15100" in buffer) and
                        buffer.rstrip().endswith("F")):
                    time.sleep(0.35)
                    if ser.in_waiting:
                        buffer += ser.read(ser.in_waiting).decode(errors="ignore")
                    result = parse_hl7(buffer)
                    self.root.after(0, lambda r=result: self.update(r))
                    buffer = ""

                if len(buffer) > 131072:
                    buffer = ""

                time.sleep(0.05)
            except Exception as e:
                self.root.after(0, lambda msg=str(e): self.lbl_status.config(
                    text=f"● Serial error: {msg}", fg=RED))
                time.sleep(2)


# ── ENTRY ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    root = tk.Tk()
    MerilyzerApp(root)
    root.mainloop()