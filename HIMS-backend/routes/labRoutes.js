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
  mapAnalyzerTests,
  createUnsolicitedWorklist,
  mapUnmappedTest
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
import { sendWhatsAppMessage } from '../services/whatsappService.js';

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
router.post('/unsolicited-worklist', createUnsolicitedWorklist);
router.post('/map-unmapped-test', mapUnmappedTest);
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

// WhatsApp Report Share Route
router.post('/whatsapp-send-report', async (req, res) => {
  const { sampleId, phone, patientName, testName } = req.body;

  if (!sampleId || !phone) {
    return res.status(400).json({ success: false, message: 'sampleId and phone are required' });
  }

  try {
    // Normalize phone number
    let normalizedPhone = phone.replace(/[\s\-\+]/g, '');
    if (normalizedPhone.length === 10) normalizedPhone = '91' + normalizedPhone;

    // Fetch PDF from own generate endpoint (internal call)
    const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:7005';
    const pdfRes = await fetch(`${BACKEND_URL}/api/lab/generate-report-pdf/${sampleId}`);
    if (!pdfRes.ok) throw new Error('Failed to generate PDF for WhatsApp');

    const pdfBuffer = await pdfRes.arrayBuffer();
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    const caption = [
      `🏥 *JHARKHAND STATE DIAGNOSTIC SERVICES*`,
      `Powered by *Merilyzer LIS*`,
      ``,
      `✅ *Report Ready!*`,
      `👤 *Patient:* ${patientName || 'Patient'}`,
      `🔬 *Test:* ${testName || 'Lab Test'}`,
      `🆔 *Sample ID:* ${sampleId}`,
      ``,
      `_Please find your lab report attached as PDF._`,
      `_Thank you for choosing Meril HIMS._`
    ].join('\n');

    await sendWhatsAppMessage(normalizedPhone, caption, base64, `lab-report-${sampleId}.pdf`);

    res.json({ success: true, message: 'Report sent on WhatsApp successfully' });
  } catch (err) {
    console.error('WhatsApp send report error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

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