"""
CelQuant BF-6900 / BF-6960 — LIS Server
Protocol : HL7 2.3.1 over TCP/IP with MLLP framing
Framing  : <VT=0x0B> ... <FS=0x1C><CR=0x0D>

From your photo:
  Analyzer LIS IP   → 192.168.1.127   (where YOUR PC runs this server)
  Analyzer LIS Port → 9500
  Analyzer local IP → 192.168.1.149

Run:  python lis_server.py
      python lis_server.py --host 0.0.0.0 --port 9500
"""

import socket
import threading
import argparse
import datetime

# ── MLLP framing bytes ──────────────────────────────────────────────────────
VT  = b'\x0b'   # Start Block  (SB)
FS  = b'\x1c'   # End Block    (EB)
CR  = b'\x0d'   # Carriage Return

# ── OBX-3 identifier → human label (Appendix B, §A.7) ───────────────────────
OBX_LABELS = {
    "2001": "Analysis Mode",
    "2002": "Measurement Mode",
    "2003": "Reference Group",
    "2004": "Remarks",
    "2005": "QC Level",
    "2006": "WBC  (White Blood Cells)",
    "2007": "NEU% (Neutrophil %)",
    "2008": "LYM% (Lymphocyte %)",
    "2009": "MON% (Monocyte %)",
    "2010": "EOS% (Eosinophil %)",
    "2011": "BAS% (Basophil %)",
    "2012": "NEU# (Neutrophil count)",
    "2013": "LYM# (Lymphocyte count)",
    "2014": "MON# (Monocyte count)",
    "2015": "EOS# (Eosinophil count)",
    "2016": "BAS# (Basophil count)",
    "2017": "RBC  (Red Blood Cells)",
    "2018": "HGB  (Hemoglobin)",
    "2019": "MCV  (Mean Cell Volume)",
    "2020": "HCT  (Hematocrit)",
    "2021": "MCH  (Mean Cell Hgb)",
    "2022": "MCHC (Mean Cell Hgb Conc.)",
    "2023": "RDW-SD",
    "2024": "RDW-CV",
    "2025": "PLT  (Platelets)",
    "2026": "MPV  (Mean Platelet Volume)",
    "2027": "PCT  (Plateletcrit)",
    "2028": "PDW  (Platelet Dist. Width)",
    "2029": "P-LCR (Large Platelet Ratio)",
    "2030": "P-LCC (Large Platelet Count)",
    "2101": "RBC Scattergram (PNG/Base64)",
    "2102": "PLT Scattergram (PNG/Base64)",
    "2103": "WBC Scattergram (PNG/Base64)",
    "2104": "WBC Histogram (PNG/Base64)",
    "2105": "RBC Histogram (PNG/Base64)",
    "2106": "PLT Histogram (PNG/Base64)",
}

OBR4_LABELS = {
    "1001": "Sample Count Results",
    "1002": "L-J QC Results",
    "1003": "Xbar QC Results",
    "1004": "X-B QC Results",
    "1005": "CRP QC Results",
    "1006": "Xbar-R QC Results",
}

SEP = "─" * 68


def parse_hl7(raw: str) -> dict:
    """
    Parse a raw HL7 2.3.1 message from the BF-6900.
    Returns a dict with keys: msh, pid, pv1, obr, obx_list, msa, orc
    """
    result = {"msh": {}, "pid": {}, "pv1": {}, "obr": {}, "obx_list": [], "msa": {}, "orc": {}}

    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        seg = line[:3]
        fields = line.split("|")

        if seg == "MSH":
            result["msh"] = {
                "sending_app":    fields[2] if len(fields) > 2 else "",
                "instrument_id":  fields[3] if len(fields) > 3 else "",
                "receiving_app":  fields[4] if len(fields) > 4 else "",
                "timestamp":      fields[6] if len(fields) > 6 else "",
                "msg_type":       fields[8] if len(fields) > 8 else "",
                "msg_control_id": fields[9] if len(fields) > 9 else "",
                "processing_id":  fields[10] if len(fields) > 10 else "",
                "hl7_version":    fields[11] if len(fields) > 11 else "",
                "charset":        fields[17] if len(fields) > 17 else "",
            }

        elif seg == "PID":
            result["pid"] = {
                "patient_id":   fields[3] if len(fields) > 3 else "",
                "patient_name": fields[5] if len(fields) > 5 else "",
                "sex":          fields[8] if len(fields) > 8 else "",
                "age":          fields[31] if len(fields) > 31 else "",
            }

        elif seg == "PV1":
            result["pv1"] = {
                "department":   fields[3] if len(fields) > 3 else "",
                "charge_type":  fields[20] if len(fields) > 20 else "",
            }

        elif seg == "OBR":
            obr4 = fields[4] if len(fields) > 4 else ""
            obr4_parts = obr4.split("^")
            obr4_code = obr4_parts[0] if obr4_parts else ""
            result["obr"] = {
                "barcode":       fields[2] if len(fields) > 2 else "",
                "sample_id":     fields[3] if len(fields) > 3 else "",
                "result_type":   OBR4_LABELS.get(obr4_code, obr4),
                "sampling_time": fields[6] if len(fields) > 6 else "",
                "count_time":    fields[7] if len(fields) > 7 else "",
                "submitter":     fields[10] if len(fields) > 10 else "",
                "doctor":        fields[28] if len(fields) > 28 else "",
            }

        elif seg == "OBX":
            # OBX|seq|type|id^name||value|unit|ref_range|||status
            obx3      = fields[3] if len(fields) > 3 else ""
            obx3_code = obx3.split("^")[0]
            label     = OBX_LABELS.get(obx3_code, obx3)
            dtype     = fields[2] if len(fields) > 2 else ""
            value     = fields[5] if len(fields) > 5 else ""
            unit      = fields[6] if len(fields) > 6 else ""
            ref_range = fields[7] if len(fields) > 7 else ""
            status    = fields[11] if len(fields) > 11 else ""

            # Truncate base64 image data for readability
            display_value = value
            if dtype == "ED" and len(value) > 40:
                display_value = f"[Base64 image, {len(value)} chars]"

            result["obx_list"].append({
                "seq":       fields[1] if len(fields) > 1 else "",
                "label":     label,
                "value":     display_value,
                "unit":      unit,
                "ref_range": ref_range,
                "status":    status,
                "is_image":  dtype == "ED",
            })

        elif seg == "MSA":
            result["msa"] = {
                "ack_code":  fields[1] if len(fields) > 1 else "",
                "msg_id":    fields[2] if len(fields) > 2 else "",
                "error_msg": fields[3] if len(fields) > 3 else "",
            }

        elif seg == "ORC":
            result["orc"] = {
                "order_control": fields[1] if len(fields) > 1 else "",
                "sample_id":     fields[3] if len(fields) > 3 else "",
                "order_status":  fields[5] if len(fields) > 5 else "",
            }

    return result


def fmt_ts(ts: str) -> str:
    """Format YYYYMMDDHHMMSS → readable string."""
    try:
        return datetime.datetime.strptime(ts[:14], "%Y%m%d%H%M%S").strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return ts


def print_result(parsed: dict, addr: tuple):
    """Pretty-print a parsed HL7 result to the terminal."""
    msh = parsed["msh"]
    pid = parsed["pid"]
    obr = parsed["obr"]
    pv1 = parsed["pv1"]
    obx = parsed["obx_list"]

    print(f"\n{SEP}")
    print(f"  📥  HL7 MESSAGE  from {addr[0]}:{addr[1]}")
    print(SEP)

    # ── Header info ──
    print(f"  Instrument   : {msh.get('instrument_id', '')} ({msh.get('sending_app', '')})")
    print(f"  HL7 Version  : {msh.get('hl7_version', '')}   Charset: {msh.get('charset', '')}")
    print(f"  Message Type : {msh.get('msg_type', '')}   Control ID: {msh.get('msg_control_id', '')}")
    print(f"  Message Time : {fmt_ts(msh.get('timestamp', ''))}")

    # ── Patient ──
    if pid.get("patient_id") or pid.get("patient_name"):
        print(f"\n  ── Patient ─────────────────────────────────────────")
        if pid.get("patient_name"):
            print(f"  Name         : {pid['patient_name']}")
        if pid.get("patient_id"):
            print(f"  Case No.     : {pid['patient_id']}")
        sex_map = {"M": "Male", "F": "Female", "O": "Other"}
        if pid.get("sex"):
            print(f"  Sex          : {sex_map.get(pid['sex'], pid['sex'])}")
        if pid.get("age"):
            age_parts = pid["age"].split("^")
            age_unit  = {"Y": "years", "M": "months", "D": "days", "H": "hours"}
            unit_str  = age_unit.get(age_parts[1], age_parts[1]) if len(age_parts) > 1 else ""
            print(f"  Age          : {age_parts[0]} {unit_str}")
    if pv1.get("department"):
        print(f"  Department   : {pv1['department']}")

    # ── Sample ──
    if obr:
        print(f"\n  ── Sample ──────────────────────────────────────────")
        if obr.get("barcode"):
            print(f"  Barcode      : {obr['barcode']}")
        if obr.get("sample_id"):
            print(f"  Sample ID    : {obr['sample_id']}")
        print(f"  Result Type  : {obr.get('result_type', '')}")
        if obr.get("sampling_time"):
            print(f"  Sampling Time: {fmt_ts(obr['sampling_time'])}")
        if obr.get("count_time"):
            print(f"  Count Time   : {fmt_ts(obr['count_time'])}")
        if obr.get("doctor"):
            print(f"  Doctor       : {obr['doctor']}")

    # ── Results ──
    numeric = [o for o in obx if not o["is_image"]]
    images  = [o for o in obx if o["is_image"]]

    if numeric:
        print(f"\n  ── Test Results ────────────────────────────────────")
        print(f"  {'#':<4} {'Parameter':<32} {'Value':<12} {'Unit':<12} {'Ref Range':<18} {'Status'}")
        print(f"  {'─'*4} {'─'*32} {'─'*12} {'─'*12} {'─'*18} {'─'*6}")
        for o in numeric:
            flag = ""
            if o["ref_range"] and o["value"] and o["value"] not in ("", "0"):
                try:
                    parts = o["ref_range"].split("-")
                    if len(parts) == 2:
                        lo, hi = float(parts[0]), float(parts[1])
                        val = float(o["value"])
                        if val < lo:
                            flag = " ▼"
                        elif val > hi:
                            flag = " ▲"
                except Exception:
                    pass
            print(f"  {o['seq']:<4} {o['label']:<32} {o['value'] + flag:<12} {o['unit']:<12} {o['ref_range']:<18} {o['status']}")

    if images:
        print(f"\n  ── Attached Images ({len(images)}) ─────────────────────────────")
        for o in images:
            print(f"  [{o['seq']}] {o['label']:40}  {o['value']}")

    print(SEP)


def build_ack(msg_control_id: str, ack_code: str = "AA") -> bytes:
    """Build an MLLP-wrapped HL7 ACK response."""
    ts  = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    ack = (
        f"MSH|^~\\&|LIS||BF-6900|||{ts}||ACK|{ts}|P|2.3.1\r"
        f"MSA|{ack_code}|{msg_control_id}|Message accepted\r"
    )
    return VT + ack.encode("utf-8") + FS + CR


def recv_mllp(conn: socket.socket) -> str | None:
    """
    Read one complete MLLP frame from the socket.
    Returns the inner HL7 string, or None if connection closed.
    """
    buffer = b""
    while True:
        chunk = conn.recv(4096)
        if not chunk:
            return None
        buffer += chunk
        # Look for complete frame: VT ... FS CR
        if VT in buffer:
            start = buffer.index(VT) + 1
            end   = buffer.find(FS + CR, start)
            if end != -1:
                return buffer[start:end].decode("utf-8", errors="replace")


def handle_client(conn: socket.socket, addr: tuple):
    print(f"\n  [+] Analyzer connected  →  {addr[0]}:{addr[1]}")
    try:
        while True:
            raw = recv_mllp(conn)
            if raw is None:
                print(f"  [-] Analyzer disconnected  →  {addr[0]}:{addr[1]}")
                break

            # Print raw HL7 for debugging
            print(f"\n  [RAW HL7 from {addr[0]}:{addr[1]}]")
            for line in raw.splitlines():
                if line.strip():
                    print(f"    {line}")

            # Parse and pretty-print
            parsed = parse_hl7(raw)
            print_result(parsed, addr)

            # Send ACK back to analyzer
            msg_id = parsed["msh"].get("msg_control_id", "1")
            conn.sendall(build_ack(msg_id, "AA"))
            print(f"  [✓] ACK sent to analyzer")

    except (ConnectionResetError, BrokenPipeError):
        print(f"  [!] Connection lost  →  {addr[0]}:{addr[1]}")
    finally:
        conn.close()


def start_server(host: str, port: int):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((host, port))
    server.listen(5)

    print(SEP)
    print(f"  CelQuant BF-6900 / BF-6960  —  LIS Server")
    print(f"  Protocol : HL7 2.3.1 over MLLP")
    print(f"  Listening: {host}:{port}")
    print(f"  Set analyzer LIS → IP: <this machine's IP>  Port: {port}")
    print(SEP)
    print("  Waiting for analyzer connection…\n")

    try:
        while True:
            conn, addr = server.accept()
            t = threading.Thread(target=handle_client, args=(conn, addr), daemon=True)
            t.start()
    except KeyboardInterrupt:
        print("\n  [STOPPED] Server shut down.")
    finally:
        server.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CelQuant BF-6900 LIS Server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=9500, help="Port (default: 9500, matches your machine)")
    args = parser.parse_args()
    start_server(args.host, args.port)
