# CDAC-HMIS LIS Integration Architecture

## Overview

This document explains the proposed integration workflow between the Laboratory Information System (LIS) and the C-DAC HMIS platform.

The integration is designed to allow:

* HMIS-based investigation order management
* LIS-based laboratory workflow management
* Analyzer integration
* Structured result synchronization
* Final report upload and status synchronization

The LIS will function as the operational laboratory system, while HMIS will function as the centralized hospital investigation and reporting platform.

---

# Integration Workflow

```text
HMIS Investigation Order
        ↓
LIS Fetches Investigation Details
        ↓
Internal Worklist Generation
        ↓
Barcode / Accession Generation
        ↓
Sample Collection
        ↓
Analyzer Processing
        ↓
Structured Result Upload
        ↓
Doctor Verification & Authorization
        ↓
Final PDF Report Upload
```

---

# Step 1 – Investigation Fetch from HMIS

## API Used

* API 1 (`hmis_request_type: 1`)

## Flow

When a patient arrives at the laboratory:

1. LIS receives/scans the Patient CR Number.
2. LIS calls API 1 using:

   * `hmis_patCrNo`
   * `hmis_hosp_mapping_code`
3. HMIS returns:

   * Patient Information
   * Investigation Details
   * Test Details
   * Sample Details
   * Current Investigation Status

## Data Retrieved

* `hmis_req_no`
* `hmis_req_dno`
* `hmis_test_code`
* `hmis_test_name`
* `hmis_sample_code`
* `hmis_sample_name`
* `cdac_inv_status`

These details are used by the LIS to generate the internal laboratory worklist.

---

# Step 2 – Internal Worklist Generation

After receiving investigation details:

1. LIS generates internal laboratory worklists.
2. Tests are grouped based on:

   * Laboratory
   * Analyzer
   * Sample Type
   * Processing Priority

The LIS internally manages:

* Queue Management
* Sample Tracking
* Technician Assignment
* Analyzer Routing

---

# Step 3 – Barcode / Accession Generation

Currently, no HMIS API has been identified for barcode generation.

Therefore, the LIS will internally generate:

* Barcode IDs
* Sample Accession Numbers
* Sample Labels

The LIS will internally map generated barcodes with:

* `hmis_req_no`
* `hmis_req_dno`

Example:

```text
Barcode → X-JH-2026-000001
Mapped To → hmis_req_no + hmis_req_dno
```

---

# Step 4 – Sample Collection Status Update

## API Used

* API 2 (`hmis_request_type: 2`)

## Flow

After phlebotomy/sample collection:

1. LIS updates HMIS with:

   * Sample Collection Status
   * Test Information
   * Sample Information

## Status Sent

```text
poct_status = SAMPLE_COLLECTED
```

HMIS internally updates:

```text
cdac_inv_status = 3
```

This confirms successful sample collection acknowledgement.

---

# Step 5 – Analyzer Integration

## Internal LIS Workflow

The LIS integrates directly with laboratory analyzers using:

* Serial Port / COM Communication
* TCP/IP Analyzer Interfaces
* ASTM/HL7 Parsing
* Vendor-Specific Drivers

The analyzer sends:

* Parameter Values
* Units
* Flags
* Reference Data

The LIS internally stores:

* Raw Analyzer Data
* Processed Result Data
* Validation Flags
* Audit Logs

---

# Step 6 – Structured Result Upload to HMIS

## API Used

* API 6 (`hmis_request_type: 31`)

## Purpose

API 6 is used for parameter-wise analyzer result synchronization.

## Data Uploaded

* Parameter Codes
* Parent Parameter Codes
* Result Values
* Units
* Reference Ranges
* Abnormal Flags

Example:

```json
{
  "hmis_parameter_code": "5126",
  "hmis_str_value": "13.5",
  "hmis_referencerange": "12-16",
  "hmis_isinrefrange": "1"
}
```

## Requirement

The LIS requires complete master mappings for:

* Parameter Codes
* Parent Parameter Codes
* UOM Details
* Reference Range Standards

to correctly map analyzer output parameters with HMIS standardized codes.

---

# Step 7 – Verification & Authorization

## APIs Used

* API 2
* API 3

## Workflow

### Result Verification

LIS updates intermediate workflow statuses such as:

```text
RESULT_SAVED
VERIFIED
```

### Doctor Authorization

After pathologist/doctor approval:

```text
poct_status = AUTHORIZED
```

API 3 updates HMIS:

```text
cdac_inv_status = 13
```

This indicates final authorized report status.

---

# Step 8 – PDF Report Generation & Upload

## API Used

* API 5 (`hmis_request_type: 5`)

## Flow

1. LIS generates final laboratory report PDF.
2. PDF is converted to Base64 format.
3. LIS uploads the PDF to HMIS.

## Status

```text
poct_status = PRINTED
```

HMIS updates:

```text
cdac_inv_status = 26
```

## Upload Field

```text
poct_pdf_rpt_base64
```

This enables HMIS-side report archival and viewing.

---

# API Usage Summary

| Purpose                    | API   |
| -------------------------- | ----- |
| Investigation Fetch        | API 1 |
| Workflow Status Update     | API 2 |
| Final Authorization        | API 3 |
| Investigation Status Check | API 4 |
| PDF Report Upload          | API 5 |
| Structured Result Upload   | API 6 |
| Master Data Retrieval      | API 7 |

---

# Master Data Dependency

API 7 currently provides:

* Laboratory Codes
* Sample Codes
* Test Codes
* UOM Codes

Additional mappings required for analyzer integration:

* Parameter Codes
* Parent Parameter Codes
* Reference Range Standards
* UOM Descriptions

Clarification is required regarding whether these mappings will be:

* Provided by C-DAC/HMIS
  OR
* Maintained internally within the LIS.

---

# Final Integration Architecture

## HMIS Responsibilities

* Investigation Order Management
* Patient Investigation Registry
* Investigation Status Management
* Centralized Report Repository

## LIS Responsibilities

* Laboratory Workflow Management
* Barcode & Accession Management
* Analyzer Integration
* Parameter Processing
* Validation & Authorization Workflow
* PDF Report Generation
* HMIS Synchronization

---

# Conclusion

The integration architecture supports a complete enterprise-grade LIS workflow integrated with the C-DAC HMIS ecosystem.

The proposed integration enables:

* End-to-end laboratory workflow automation
* Structured analyzer result synchronization
* Centralized HMIS reporting
* Real-time investigation status updates
* Hospital-wide laboratory interoperability
