import express from 'express';
import {
  registerPatient,
  searchPatients,
  loginByPhone,
  getPatientProfile,
  getPatientReports,
  downloadPatientReport,
  downloadPatientReportPDF
} from '../controllers/patientController.js';

const router = express.Router();

// Staff/Admin routes
router.post('/register', registerPatient);
router.get('/search', searchPatients);

// Patient Portal routes
router.post('/portal/login', loginByPhone);
router.get('/portal/profile/:phone', getPatientProfile);
router.get('/portal/reports/:phone', getPatientReports);
router.get('/portal/reports/:phone/:sampleId', downloadPatientReport);
router.get('/portal/reports/:phone/:sampleId/pdf', downloadPatientReportPDF);

export default router;
