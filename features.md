# HIMS: Laboratory & Inventory System Features

## 🔬 Advanced Laboratory Management System
The laboratory module is a fully integrated, automated, and secure end-to-end workflow designed for high patient throughput and zero-friction communication.

### 1. Smart Queueing & Flow Control
* **Automated Daily FIFO Queue:** Billing instantly places the patient in the lab queue with a sequential daily token number.
* **Auto-Deduplication Engine:** Backend strictly prevents identical tests from being queued simultaneously (cancels accidental double-billing).
* **Public TV Mode (`/lab-tv`):** A high-contrast, auto-refreshing public dashboard for patients to monitor the live token queue in the waiting area.
* **Predictive Patient Pinging:** 
  * *Immediate Next Patient:* Receives an automated WhatsApp ping: *"Now it's your turn! Please proceed to the Lab."*
  * *Patient After Next:* Receives a preparatory ping: *"1 more patient ahead of you. Please reach the Lab."*

### 2. Live Patient Tracking
* **Real-Time Lifecycle Timeline (`/track`):** Patients and doctors can use a unique reference number to track the test status in real-time (*Billed → Sample Collected → Results Entered → Verification Pending → Approved*).

### 3. Processing & Verification
* **Discrete Parameter Entry:** Lab technicians input specific parameters, which automatically flag against biological reference intervals (High/Low/Normal).
* **Multi-Level Approval:** strict workflow ensuring only authorized Pathologists or Lab Heads can *Verify* and *Approve* results.

### 4. Secure Result Delivery
* **Professional PDF Generation:** Automated, hospital-branded report generation using `pdfkit`, featuring QR code validation and digital signatures.
* **Military-Grade Encryption:** Native 128-bit AES password protection applied to every PDF before delivery, locked using the patient's Registration Number.
* **Automated WhatsApp Dispatch:** The moment a doctor clicks "Approve", the encrypted PDF report and password instructions are pushed instantly to the patient's phone.

---

## 📦 Procurement & Inventory Automation
The inventory module ensures the hospital never runs out of critical medical supplies by automating the entire supply chain workflow.

### 1. Automated Reorder System
* **Threshold Triggers:** The system continuously monitors stock levels and automatically triggers procurement workflows when supplies dip below safety thresholds.
* **Automated Purchase Orders (POs):** Instantly generates production-ready PO PDFs for required restocks.

### 2. Vendor Communication
* **Automated Vendor Dispatch:** Approved Purchase Orders are automatically dispatched to vendors via Email or WhatsApp.

### 3. Financial & Supply Tracking
* **Price History Management:** Tracks the historical cost fluctuations of medical items to ensure optimal procurement pricing.
* **BioSync TFT Interface Integration:** Hardware/software interface integration for live physical monitoring of high-value inventory.
* **Centralized Dashboard:** A fully responsive React/Vite frontend UI allowing administrators to view stock alerts, override orders, and manage warehouse locations in one place.
