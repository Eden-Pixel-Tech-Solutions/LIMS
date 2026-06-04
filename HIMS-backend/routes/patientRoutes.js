import express from 'express';
import jwt from 'jsonwebtoken';
import {
  registerPatient,
  searchPatients,
  loginByPhone,
  getPatientProfile,
  getPatientReports,
  downloadPatientReport,
  downloadPatientReportPDF
} from '../controllers/patientController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Verifies patient JWT and ensures the token owner matches the requested :phone param
const authenticatePatientPortal = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Invalid token type.' });
    }
    if (decoded.phone !== req.params.phone) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const STAFF_ROLES = ['Admin', 'Doctor', 'Lab Head', 'Lab Technician', 'Staff'];

// Staff/Admin routes
router.post('/register', authenticateToken, authorizeRole(STAFF_ROLES), registerPatient);
router.get('/search', authenticateToken, authorizeRole(STAFF_ROLES), searchPatients);

// Patient Portal routes
router.post('/portal/login', loginByPhone);
router.get('/portal/profile/:phone', authenticatePatientPortal, getPatientProfile);
router.get('/portal/reports/:phone', authenticatePatientPortal, getPatientReports);
router.get('/portal/reports/:phone/:sampleId', authenticatePatientPortal, downloadPatientReport);
router.get('/portal/reports/:phone/:sampleId/pdf', authenticatePatientPortal, downloadPatientReportPDF);

export default router;
