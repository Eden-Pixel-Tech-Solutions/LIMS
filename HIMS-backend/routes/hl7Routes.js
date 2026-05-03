import express from 'express';
import { getPatientHL7, registerPatientHL7 } from '../controllers/hl7Controller.js';

const router = express.Router();

// HL7 Compatible Patient APIs
router.get('/patient/search', getPatientHL7);
router.post('/patient/register', registerPatientHL7);

export default router;
