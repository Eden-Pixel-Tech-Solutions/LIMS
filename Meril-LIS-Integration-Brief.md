# Meril LIS — Integration Overview
**For:** External HMIS Vendors  
**Date:** May 2026

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR HMIS                               │
│  (Investigation Orders · Patient Registry · Status Tracking) │
└──────────────────────────┬──────────────────────────────────┘
                           │  REST API (JSON)
                           │  ← Pull / Push / Webhook →
┌──────────────────────────▼──────────────────────────────────┐
│                    Meril LIS (Backend)                       │
│         Node.js · Express · MySQL · Port 7005                │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Patient &  │  │  Lab Core    │  │  PDF Generator     │  │
│  │  Billing    │  │  (Worklist · │  │  + WhatsApp Bot    │  │
│  │  Module     │  │  Results ·   │  │  + Email SMTP      │  │
│  └─────────────┘  │  Verification│  └────────────────────┘  │
│                   └──────┬───────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │  Serial / USB-OTG / TCP / HL7
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              LIS Mobile Agent (Android Tablet)               │
│         Cliniquant Micro · Merilyzer · Other Analyzers       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Lab Workflow

```
YOUR HMIS — Creates Investigation Order
        │
        ▼
[API] LIS fetches / receives order  ←── Patient CR Number / UHID
        │
        ▼
LIS — Internal Worklist (grouped by lab, sample type, priority)
        │
        ▼
LIS — Barcode / Sample ID generated internally
  └── Mapped to your Order Reference Number
        │
        ▼
[API → YOUR HMIS]  Status: SAMPLE_COLLECTED
        │
        ▼
Analyzer processes sample  (Serial / TCP / ASTM / HL7)
        │
        ▼
[API → YOUR HMIS]  Structured Results uploaded (parameter-wise)
        │
        ▼
Lab Doctor verifies & authorizes
        │
        ▼
[API → YOUR HMIS]  Status: AUTHORIZED
        │
        ▼
LIS — PDF Report generated (branded, H/L flagged)
        │
        ├── [API → YOUR HMIS]  PDF as Base64
        ├── WhatsApp → Patient (PDF attachment)
        └── Patient Portal → Self-download
```

---

## 3. APIs We Need From You

> These are the endpoints **your HMIS must expose** for us to call.

| # | API | Purpose |
|---|-----|---------|
| 1 | `GET /your-api/investigations?patient_id=XXX` | Fetch pending lab orders for a patient |
| 2 | `POST /your-api/status-update` | We push workflow status at each stage |
| 3 | `POST /your-api/results` | We push structured parameter-wise results |
| 4 | `POST /your-api/report-upload` | We push final PDF as Base64 |
| 5 | `GET /your-api/master/tests` | Fetch your test code master list |
| 6 | `GET /your-api/master/parameters` | Fetch your parameter codes + parent codes |

---

## 4. Data We Need From You

### 4.1 To Set Up Integration

| Field | Description |
|-------|-------------|
| Base URL | Your HMIS API endpoint |
| Auth Method | API Key / OAuth2 / Basic Auth |
| Patient Key | Primary identifier — CR Number / UHID / ABHA ID |
| Hospital Code | Your facility mapping code for our branch |

### 4.2 For Each Investigation Order

| Field | Description |
|-------|-------------|
| Patient identifier | CR Number / UHID |
| Patient name, DOB, gender, mobile | Demographics |
| Order / Request Number | Unique reference (we map our barcode to this) |
| Test code + Test name | What test was ordered |
| Sample type | Blood / Urine / etc. |
| Referring doctor | Name |
| Ward / Department | (if applicable) |

### 4.3 For Result Mapping (Parameter Upload)

| Field | Description |
|-------|-------------|
| Parameter Codes | Your internal code per test parameter |
| Parent Parameter Codes | Grouping code (e.g., CBC → sub-parameters) |
| UOM Codes | Unit of measure (g/dL, x10³/µL, etc.) |
| Reference Ranges | Normal ranges per parameter (or we use ours) |

---

## 5. Status Codes We Will Send You

| Status | Meaning |
|--------|---------|
| `SAMPLE_COLLECTED` | Sample received at lab |
| `RESULT_SAVED` | Results entered |
| `VERIFIED` | Technician verified |
| `AUTHORIZED` | Doctor signed off |
| `PRINTED` | PDF report generated & uploaded |
| `SAMPLE_REJECTED` | Sample rejected (with reason) |
| `CANCELED` | Test cancelled |
