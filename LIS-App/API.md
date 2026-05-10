# API Documentation for Merilyzer Cliniquant Micro Analyzer LIS App

This document outlines the API endpoints required for the separate LIS application dedicated to the Merilyzer Cliniquant Micro Analyzer.

## Base URL
`http://<SERVER_IP>:<PORT>/api`
*(Example: `http://192.168.1.100:5000/api`)*

---

## 1. Authentication (Login)
Used by the lab technician to log into the LIS application.

**Endpoint:** `/auth/login`  
**Method:** `POST`  
**Content-Type:** `application/json`

### Request Body
```json
{
  "email": "technician@example.com",
  "password": "yourpassword"
}
```

### Success Response
**Code:** `200 OK`
```json
{
  "id": 5,
  "firstName": "John",
  "lastName": "Doe",
  "email": "technician@example.com",
  "role": "Lab Technician",
  "branch_id": 1,
  "role_level": "Branch",
  "hospital_code": "GEN-01",
  "district_id": 2,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*Note: Save the `token` for authenticated requests, and `branch_id` / `role_level` for fetching the worklist.*

---

## 2. Fetch Worklist
Fetches the pending tests assigned to the technician's specific hospital/branch.

**Endpoint:** `/lab/worklist`  
**Method:** `GET`  
**Headers:** 
- `Authorization: Bearer <token>`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branch_id` | Integer/String | Yes | The `branch_id` obtained from login (use `'all'` if admin) |
| `role_level`| String | Yes | The `role_level` obtained from login |
| `department`| String | No | Filter by department (e.g., `'Hematology'`). Use `'all'` or omit for no filter. |

### Example Request
`GET /lab/worklist?branch_id=1&role_level=Branch&department=all`

### Success Response
**Code:** `200 OK`
```json
{
  "success": true,
  "worklist": [
    {
      "bill_item_id": 105,
      "bill_id": 42,
      "bill_number": "BILL-20231015-0001",
      "patient_id": 12,
      "reg_no": "REG-12345",
      "patient_name": "Jane Smith",
      "test_id": 8,
      "test_name": "Complete Blood Count",
      "test_code": "CBC01",
      "sample_type": "Blood",
      "tube_color": "Lavender",
      "category_name": "Hematology",
      "department": "Hematology",
      "status": "Pending",
      "sample_id": "LAB-20231015-0001",
      "lab_barcode": "10002939",
      "lab_name": "Main Laboratory",
      "bill_date": "2023-10-15T08:30:00.000Z",
      "result_id": null,
      "result_tested_at": null,
      "lab_queue_number": 1
    }
  ],
  "count": 1
}
```

---

## 3. Save Test Results
Submit the parsed test results obtained directly from the Cliniquant Micro Analyzer back to the HIMS.

**Endpoint:** `/lab/save-test-results`  
**Method:** `POST`  
**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Request Body
```json
{
  "sample_id": "LAB-20231015-0001",
  "machine_no": "Cliniquant-Micro-01",
  "bill_item_id": 105,
  "test_id": 8,
  "test_name": "Complete Blood Count",
  "patient_id": 12,
  "tested_by": 5, 
  "results": [
    {
      "parameter_code": "RBC",
      "parameter_name": "Red Blood Cells",
      "result_value": "4.5",
      "parameter_unit": "mill/µL",
      "flag": "Normal",
      "reference_range": "4.0 - 5.5"
    },
    {
      "parameter_code": "WBC",
      "parameter_name": "White Blood Cells",
      "result_value": "11.2",
      "parameter_unit": "thou/µL",
      "flag": "High",
      "reference_range": "4.0 - 10.0"
    }
  ]
}
```
*Note: `tested_by` should be the ID of the logged-in technician.*

### Success Response
**Code:** `201 Created`
```json
{
  "success": true,
  "message": "Test results saved successfully",
  "data": {
    "result_id": 234,
    "sample_id": "LAB-20231015-0001",
    "machine_no": "Cliniquant-Micro-01"
  }
}
```

---

## 4. Track Test Status (Optional Utility)
Used to check the status of a specific sample or bill number.

**Endpoint:** `/lab/track/:referenceNumber`  
**Method:** `GET`  
**Headers:** 
- `Authorization: Bearer <token>`

*Note: `:referenceNumber` can be the `lab_barcode` or `bill_number`.*

### Success Response
**Code:** `200 OK`
```json
{
  "success": true,
  "data": {
    "patient_name": "Jane Smith",
    "test_name": "Complete Blood Count",
    "reference_number": "LAB-20231015-0001",
    "current_status": "Test Done",
    "timeline": [
      {
        "status": "Billed",
        "completed": true,
        "timestamp": "2023-10-15T08:30:00.000Z",
        "description": "Your lab test has been successfully booked."
      },
      {
        "status": "Test Done",
        "completed": true,
        "timestamp": "2023-10-15T10:15:00.000Z",
        "description": "Laboratory analysis has been completed."
      }
    ]
  }
}
```
