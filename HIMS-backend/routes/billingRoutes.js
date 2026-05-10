import express from 'express';
import {
  createBill,
  updateBill,
  getAllBills,
  getBillById,
  processPayment,
  getAvailableServices,
  getPatients,
  deleteBill,
  generateInvoice,
  sendWhatsApp,
  downloadInvoicePdf
} from '../controllers/billingController.js';

const router = express.Router();

// Bill CRUD operations
router.post('/create', createBill);
router.put('/:id', updateBill);
router.get('/all', getAllBills);
router.get('/:id', getBillById);
router.delete('/:id', deleteBill);
router.get('/:id/pdf', downloadInvoicePdf);

// Payment processing
router.post('/:id/payment', processPayment);

// Services and patients
router.get('/services/available', getAvailableServices);
router.get('/patients/list', getPatients);

// WhatsApp notification
router.post('/send-whatsapp', sendWhatsApp);

export default router;
