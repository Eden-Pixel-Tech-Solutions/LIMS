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
  getWorklistById,
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
  trackTestStatus,
  getHospitalCode,
  getMachineProtocol,
  getActivityLogs,
  mapAnalyzerTests
} from '../controllers/labController.js';
import {
  getLabMachines,
  getNetworkMachines,
  getMachineBySerial,
  addLabMachine,
  syncLabMachine,
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
router.post('/map-analyzer-tests', mapAnalyzerTests);

// AI Parameter Generation Route
router.post('/generate-parameters', generateTestParameters);

// Lab Worklist & Sample Collection Routes
router.get('/worklist', getWorklist);
router.get('/worklist-by-id/:id', getWorklistById);
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
router.get('/activity-logs', getActivityLogs);

// Hospital Code for Machine ID
router.get('/hospital-code/:userId', getHospitalCode);

// Lab Machines Routes
router.get('/network-machines', getNetworkMachines);
router.get('/machines/:labId', getLabMachines);
router.get('/machine-by-serial/:serialNumber', getMachineBySerial);
router.post('/machines', addLabMachine);
router.post('/machines/sync', syncLabMachine);
router.put('/machines/:id', updateLabMachine);
router.delete('/machines/:id', deleteLabMachine);

// Machine Protocol Route
router.get('/machine-protocol/:model', getMachineProtocol);

export default router;
