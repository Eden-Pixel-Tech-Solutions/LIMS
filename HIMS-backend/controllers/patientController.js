import db from '../config/db.js';
import jwt from 'jsonwebtoken';
import { generateLabReportPDFStream } from '../utils/pdfGenerator.js';

// Generate patient token
const generatePatientToken = (id, phone) => {
  return jwt.sign({ id, phone, type: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Patient Portal: Login by Phone + DOB
export const loginByPhone = async (req, res) => {
  try {
    const { phone, dob } = req.body;

    if (!phone || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and date of birth are required'
      });
    }

    const [patients] = await db.query(
      'SELECT * FROM patients WHERE telephone = ? AND dob = ?',
      [phone, dob]
    );

    if (patients.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or date of birth'
      });
    }

    const patient = patients[0];

    res.json({
      success: true,
      message: 'Login successful',
      patient: {
        id: patient.id,
        reg_no: patient.reg_no,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.telephone,
        email: patient.email_id,
        dob: patient.dob,
        gender: patient.gender
      },
      token: generatePatientToken(patient.id, patient.telephone)
    });

  } catch (error) {
    console.error('Error during patient login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Patient Portal: Get profile by phone
export const getPatientProfile = async (req, res) => {
  try {
    const { phone } = req.params;

    const [patients] = await db.query(
      `SELECT
        id, reg_no, reg_date, is_new_born,
        title, first_name, middle_name, last_name,
        dob, gender, aadhar_number, abha_id,
        marital_status, occupation, language, education_level, religion,
        citizen, email_id, telephone,
        address, suburb, city, country, postal_code,
        kin_name, kin_relation, kin_telephone,
        payer_type, insurance_provider, policy_number
      FROM patients WHERE telephone = ?`,
      [phone]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      patient: patients[0]
    });

  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// Patient Portal: Get patient's lab reports by phone
export const getPatientReports = async (req, res) => {
  try {
    const { phone } = req.params;

    const [reports] = await db.query(
      `SELECT
        tr.id,
        tr.sample_id,
        tr.test_name,
        tr.tested_at,
        tr.verified_at,
        tr.verified_by,
        tr.status,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        CONCAT(u.first_name, ' ', u.last_name) as verified_by_name
      FROM lab_test_result tr
      JOIN bill_items bi ON tr.sample_id = bi.sample_id
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON tr.verified_by = u.id
      WHERE p.telephone = ? AND tr.status = 'Approved'
      ORDER BY tr.verified_at DESC`,
      [phone]
    );

    res.json({
      success: true,
      count: reports.length,
      reports
    });

  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reports'
    });
  }
};

// Patient Portal: Download specific report
export const downloadPatientReport = async (req, res) => {
  try {
    const { phone, sampleId } = req.params;

    const [rows] = await db.query(
      `SELECT
        tr.id,
        tr.sample_id,
        tr.machine_no,
        tr.test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.verified_by,
        tr.verified_at,
        tr.notes,
        tr.status,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        p.dob as patient_dob,
        p.gender as patient_gender,
        CONCAT(ut.first_name, ' ', ut.last_name) as tested_by_name,
        CONCAT(uv.first_name, ' ', uv.last_name) as verified_by_name
      FROM lab_test_result tr
      JOIN bill_items bi ON tr.bill_item_id = bi.id
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users ut ON tr.tested_by = ut.id
      LEFT JOIN users uv ON tr.verified_by = uv.id
      WHERE tr.sample_id = ? AND p.telephone = ? AND tr.status = 'Approved'`,
      [sampleId, phone]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or not approved'
      });
    }

    const report = rows[0];

    let results = [];
    try {
      results = typeof report.results_json === 'string'
        ? JSON.parse(report.results_json)
        : report.results_json;
    } catch (e) {
      results = [];
    }

    res.json({
      success: true,
      report: {
        id: report.id,
        sample_id: report.sample_id,
        test_name: report.test_name,
        patient_name: report.patient_name,
        patient_reg_no: report.patient_reg_no,
        patient_dob: report.patient_dob,
        patient_gender: report.patient_gender,
        tested_by_name: report.tested_by_name,
        tested_at: report.tested_at,
        verified_by_name: report.verified_by_name,
        verified_at: report.verified_at,
        results,
        notes: report.notes
      }
    });

  } catch (error) {
    console.error('Error downloading patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading report'
    });
  }
};

// Patient Portal: Generate and download PDF report
export const downloadPatientReportPDF = async (req, res) => {
  try {
    const { phone, sampleId } = req.params;

    // Verify patient owns this report
    const [verifyRows] = await db.query(
      `SELECT tr.id
      FROM lab_test_result tr
      JOIN bill_items bi ON tr.sample_id = bi.sample_id
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      WHERE tr.sample_id = ? AND p.telephone = ? AND tr.status = 'Approved'`,
      [sampleId, phone]
    );

    if (!verifyRows || verifyRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    // Fetch full report data
    const [rows] = await db.query(
      `SELECT
        tr.id,
        tr.sample_id,
        tr.machine_no,
        tr.test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.verified_by,
        tr.verified_at,
        tr.notes,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        p.gender,
        p.dob,
        CONCAT(ut.first_name, ' ', ut.last_name) as tested_by_name,
        CONCAT(uv.first_name, ' ', uv.last_name) as verified_by_name,
        i.name as lab_name
      FROM lab_test_result tr
      JOIN bill_items bi ON tr.sample_id = bi.sample_id
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users ut ON tr.tested_by = ut.id
      LEFT JOIN users uv ON tr.verified_by = uv.id
      LEFT JOIN infrastructure i ON bi.lab_id = i.id
      WHERE tr.sample_id = ? AND tr.status = 'Approved'
      LIMIT 1`,
      [sampleId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = rows[0];

    // Parse JSON results
    let results = [];
    try {
      results = typeof report.results_json === 'string'
        ? JSON.parse(report.results_json)
        : report.results_json;
    } catch {
      results = [];
    }

    // Calculate age from DOB
    let age = 'N/A';
    if (report.dob) {
      const birthDate = new Date(report.dob);
      const today = new Date();
      let ageYears = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageYears--;
      }
      age = ageYears + ' Y';
    }

    // Format dates
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', '');
    };

    // Build report URL for QR code
    const reportUrl = `${req.protocol}://${req.get('host')}/api/lab/report-details/${sampleId}`;

    // Transform to PDF format
    const reportData = {
      patient_name: report.patient_name || 'Unknown',
      patient_reg_no: report.patient_reg_no || 'N/A',
      sample_id: report.sample_id,
      gender: report.gender || 'N/A',
      age: age,
      referred_by: 'Self',
      centre: report.lab_name || 'MERIL HIMS',
      registration_date: formatDate(report.tested_at),
      tested_by_name: report.tested_by_name || 'N/A',
      tested_at: formatDate(report.tested_at),
      verified_by_name: report.verified_by_name || 'N/A',
      verified_at: formatDate(report.verified_at),
      report_url: reportUrl,
      tests: [{
        test_name: report.test_name || 'Lab Test',
        sample_type: 'Blood Sample',
        accession_no: report.sample_id,
        collected_on: formatDate(report.tested_at),
        received_on: formatDate(report.tested_at),
        approved_on: formatDate(report.verified_at),
        remarks: report.notes || 'Please correlate results clinically.',
        parameters: results.map(r => ({
          parameter_name: r.parameter_name || r.parameter_code || 'Unknown',
          result_value: r.value || r.result_value || '',
          unit: r.unit || r.parameter_unit || '',
          reference_range: r.reference_range || (r.min_value && r.max_value ? `${r.min_value} - ${r.max_value}` : ''),
          result_flag: (r.result_flag || 'normal').toLowerCase(),
          is_subheader: r.is_subheader || false
        }))
      }]
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${sampleId}.pdf"`);

    // Generate and stream PDF
    const doc = await generateLabReportPDFStream(reportData);
    doc.pipe(res);

  } catch (error) {
    console.error('Error generating patient PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating PDF'
    });
  }
};

export const registerPatient = async (req, res) => {
  try {
    const data = req.body;
    
    // Extract fields matching the DB schema
    const {
      regNo, regDate, isNewBorn, photo_base64,
      title, firstName, middleName, lastName, dob, gender,
      aadharNumber, abhaId,
      maritalStatus, occupation, language, educationLevel, religion,
      citizen, emailId, telephone, fileRequired,
      address, suburb, city, country, postalCode, postalAddress,
      kinSameAddress, kinName, kinRelation, kinTelephone,
      kinAddress, kinSuburb, kinCity, kinCountry, kinCode,
      payerType, insuranceProvider, policyNumber,
      branch_id
    } = data;

    const query = `
      INSERT INTO patients (
        reg_no, reg_date, is_new_born, photo_base64,
        title, first_name, middle_name, last_name, dob, gender,
        aadhar_number, abha_id,
        marital_status, occupation, language, education_level, religion,
        citizen, email_id, telephone, file_required,
        address, suburb, city, country, postal_code, postal_address_check,
        kin_same_address, kin_name, kin_relation, kin_telephone,
        kin_address, kin_suburb, kin_city, kin_country, kin_code,
        payer_type, insurance_provider, policy_number, branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      regNo, regDate, isNewBorn || false, photo_base64 || null,
      title, firstName, middleName, lastName, dob || null, gender,
      aadharNumber || null, abhaId || null,
      maritalStatus, occupation, language, educationLevel, religion,
      citizen, emailId, telephone, fileRequired || false,
      address, suburb, city, country, postalCode, postalAddress || false,
      kinSameAddress || false, kinName, kinRelation, kinTelephone,
      kinAddress, kinSuburb, kinCity, kinCountry, kinCode,
      payerType, insuranceProvider, policyNumber, branch_id || null
    ];

    const [result] = await db.query(query, values);

    res.status(201).json({ 
      success: true, 
      message: 'Patient registered successfully', 
      patientId: result.insertId,
      regNo 
    });

  } catch (error) {
    console.error('Error saving patient:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error saving patient' });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { type, q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    let query = '';
    let params = [];

    // Allow targeting specific fields from the dropdown
    if (type === 'telephone') {
      query = `SELECT * FROM patients WHERE telephone LIKE ? LIMIT 20`;
      params = [`%${q}%`];
    } else if (type === 'email_id') {
      query = `SELECT * FROM patients WHERE email_id LIKE ? LIMIT 20`;
      params = [`%${q}%`];
    } else if (type === 'aadhar_number') {
      query = `SELECT * FROM patients WHERE aadhar_number LIKE ? LIMIT 20`;
      params = [`%${q}%`];
    } else if (type === 'abha_id') {
      query = `SELECT * FROM patients WHERE abha_id LIKE ? LIMIT 20`;
      params = [`%${q}%`];
    } else {
      // Fallback global search
      query = `
        SELECT * FROM patients 
        WHERE telephone LIKE ? 
           OR email_id LIKE ? 
           OR aadhar_number LIKE ? 
           OR abha_id LIKE ?
           OR first_name LIKE ?
           OR last_name LIKE ?
        LIMIT 20
      `;
      params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
    }

    const [rows] = await db.query(query, params);

    res.json({ success: true, patients: rows });
  } catch (error) {
    console.error('Error searching patient:', error);
    res.status(500).json({ success: false, message: 'Server error searching patient' });
  }
};
