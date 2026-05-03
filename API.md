
# 🔹 DATA REQUIRED FROM CDAC HMIS → MERIL LIS

### 🧾 1. Patient Registration (ADT)
* Patient ID (UHID / MRN)
* Patient Name
* Age / Date of Birth
* Gender
* Contact Number
* Address (optional)
* Patient Type (OP/IP)

---

### 🏥 2. Visit / Encounter Details
* Visit ID
* Admission Type (OPD/IPD)
* Ward / Bed (if IPD)
* Consulting Doctor
* Department

---

### 🧪 3. Lab Order (ORM^O01) — **CORE**
* Order ID (Placer Order Number)
* Ordered Tests (Test Codes)
* Sample Type (Blood, Serum, Urine, etc.)
* Priority (Routine / STAT)
* Order Date & Time
* Ordering Doctor

---

# 🔸 DATA SENT FROM MERIL LIS → CDAC HMIS

### 🧪 1. Lab Results (ORU^R01) — **CORE OUTPUT**
* Order ID (to link with HMIS)
* Patient ID
* Test Code
* Result Value
* Units
* Reference Range
* Abnormal Flag (High/Low/Normal)
* Result Status (Final)

---

# 🚀 HL7 INTEGRATION ENDPOINTS

| Feature | Endpoint (Meril LIS) | Method | Description |
|---------|----------------|--------|-------------|
| **Submit Order** | `/api/hl7/order` | POST | Accept ORM message from CDAC HMIS |
| **Search Patient** | `/api/hl7/patient/search` | GET | Search by Phone, Name, ABHA, Aadhar, UHID |
| **Register Patient**| `/api/hl7/patient/register` | POST | Sync new patient demographics from HMIS |
| **Push Results** | `CDAC_HMIS_URL` | POST | LIS pushes ORU results to CDAC |
| **Query Results** | `/api/hl7/query/:orderId` | GET | CDAC pulls results for a specific Order |

---

## 🛠 Next Steps for CDAC Collaboration
1. **Schema Mapping:** Map CDAC's internal HIS codes to Meril LIS analyzer codes.
2. **Connectivity:** Whitelist Meril LIS IP on CDAC server for incoming ORU results.
3. **ACK Validation:** Ensure both systems handle HL7 Acknowledgement messages.
