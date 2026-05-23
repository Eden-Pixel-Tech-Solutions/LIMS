# HIMS Application Security Testing Data

This document provides a high-level overview of the application architecture, tech stack, and asset counts for the HIMS Frontend and Backend to assist the security testing company in their audit scope.

## 1. Technology Stack

### Frontend (Client-Side)
*   **Core Framework:** React.js (v19.2)
*   **Build Tool:** Vite
*   **Routing:** React Router DOM (v6)
*   **HTTP Client:** Axios
*   **Key Libraries:** 
    *   `pdfkit` / `jspdf` / `html2canvas` (PDF Generation)
    *   `recharts` (Data Visualization)
    *   `lucide-react` (Icons)
    *   `jsbarcode` / `qrcode` (Barcode/QR rendering)
    *   `dompurify` (XSS Sanitization)

### Backend (Server-Side)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MySQL (`mysql2` driver)
*   **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
*   **File Handling:** Multer (Multipart/form-data)
*   **External Communications:** `nodemailer`, `axios`, `node-fetch`

---

## 2. Database Architecture

The system utilizes a **MySQL** relational database to ensure ACID compliance and structured data integrity across clinical and operational modules.

*   **Database Engine:** MySQL 8.x
*   **Driver:** `mysql2` (Node.js)
*   **Total Tables:** **32 Tables**
*   **Key Schemas & Modules:**
    *   **Patient & Billing:** `patients`, `appointments`, `bills`, `bill_items`, `billing_packages`.
    *   **Laboratory (LIS):** `lab_tests`, `lab_test_parameters`, `lab_categories`, `lab_test_result`, `lab_machines`, `sample_types`, `sample_containers`.
    *   **Inventory & SCM:** `inventory_item_master`, `inventory_stock`, `inventory_batches`, `inventory_transactions`, `purchase_orders`, `vendors`.
    *   **Administration:** `users`, `departments`, `infrastructure`, `duty_schedules`.

*(The database uses strict foreign key constraints to maintain referential integrity between the patient lifecycle, financial billing, and inventory consumption.)*

---

## 3. Page Analysis

Because the frontend is a Single Page Application (SPA), all routing and rendering are handled dynamically by React on the client side. The backend serves purely as a RESTful API.

*   **Number of Dynamic Pages (Frontend):** **37 Pages** 
    *(Handled via React Router. Includes Admin Dashboards, Patient Registration, Lab Worklists, Billing, Inventory modules, and Patient Portals.)*
*   **Number of Static Pages (Frontend):** **1 Page**
    *(The singular `index.html` entry point for the Vite SPA.)*
*   **Number of Backend API Endpoints:** **~210 Routes**
    *(REST API endpoints spanning authentication, lab management, billing, and inventory CRUD operations.)*

---

## 4. Forms & Inputs

*   **Number of Forms (Frontend):** **38 Forms**
    *(Distinct `<form>` elements used across the application for patient intake, billing creation, inventory management, staff scheduling, and authentication.)*
*   **Number of Forms (Backend):** **0**
    *(The backend does not serve HTML forms; it processes incoming JSON and `multipart/form-data` payloads.)*

---

## 5. File Upload Features

There are exactly **2 File Upload mechanisms** currently implemented in the system.

1.  **Prescription Scanner (`PrescriptionScan.jsx`):** Allows users to upload images of physical prescriptions for AI OCR extraction.
2.  **Hospital Settings (`Settings.jsx`):** Allows administrators to upload Hospital Logos for PDF report branding.

*(On the backend, these are processed securely using the `multer` middleware before being stored or passed to external AI services.)*
