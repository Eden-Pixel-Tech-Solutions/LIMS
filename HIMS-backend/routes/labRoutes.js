import express from 'express';
import {
  getLabTests,
  getLabTestById,
  addLabTest,
  updateLabTest,
  deleteLabTest,
  getLabCategories,
  addLabCategory,
  updateLabCategory,
  deleteLabCategory,
  getSampleContainers,
  addSampleContainer,
  updateSampleContainer,
  deleteSampleContainer,
  getSampleTypes,
  addSampleType,
  updateSampleType,
  deleteSampleType,
  getLabs,
  getSuggestedLab,
  getWorklist,
  generateSampleId,
  acknowledgeTest,
  updateTestStatus,
  saveTestResults,
  getTestResultsBySampleId,
  getPendingVerifications,
  verifyTest,
  getApprovedReports,
  getReportDetails,
  generateLabReportPDF,
  bookLabTests,
  trackTestStatus
} from '../controllers/labController.js';
import {
  getLabMachines,
  addLabMachine,
  updateLabMachine,
  deleteLabMachine
} from '../controllers/labMachineController.js';
import { generateTestParameters } from '../controllers/aiController.js';

const router = express.Router();

// Lab Categories Routes
router.get('/categories', getLabCategories);
router.post('/categories', addLabCategory);
router.put('/categories/:id', updateLabCategory);
router.delete('/categories/:id', deleteLabCategory);

// Sample Containers Routes
router.get('/containers', getSampleContainers);
router.post('/containers', addSampleContainer);
router.put('/containers/:id', updateSampleContainer);
router.delete('/containers/:id', deleteSampleContainer);

// Sample Types Routes
router.get('/sample-types', getSampleTypes);
router.post('/sample-types', addSampleType);
router.put('/sample-types/:id', updateSampleType);
router.delete('/sample-types/:id', deleteSampleType);

// Labs Routes (from infrastructure)
router.get('/labs', getLabs);
router.get('/suggested-lab', getSuggestedLab);

// Lab Tests Routes
router.get('/tests', getLabTests);
router.get('/tests/:id', getLabTestById);
router.post('/tests', addLabTest);
router.put('/tests/:id', updateLabTest);
router.delete('/tests/:id', deleteLabTest);

// AI Parameter Generation Route
router.post('/generate-parameters', generateTestParameters);

// Lab Worklist & Sample Collection Routes
router.get('/worklist', getWorklist);
router.post('/generate-sample-id', generateSampleId);
router.post('/acknowledge-test', acknowledgeTest);
router.post('/update-test-status', updateTestStatus);

// Lab Test Booking Route
router.post('/book-tests', bookLabTests);

// Track Test Status Route
router.get('/track/:referenceNumber', trackTestStatus);

// Test Results Routes
router.post('/save-test-results', saveTestResults);
router.get('/test-results/:sampleId', getTestResultsBySampleId);

// Lab Head Doctor Verification Routes
router.get('/pending-verifications', getPendingVerifications);
router.post('/verify-test', verifyTest);

// Report Download Routes
router.get('/approved-reports', getApprovedReports);
router.get('/report-details/:sampleId', getReportDetails);
router.get('/generate-report-pdf/:sampleId', generateLabReportPDF);

// Lab Machines Routes
router.get('/machines/:labId', getLabMachines);
router.post('/machines', addLabMachine);
router.put('/machines/:id', updateLabMachine);
router.delete('/machines/:id', deleteLabMachine);

export default router;
