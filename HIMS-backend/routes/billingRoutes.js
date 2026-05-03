import express from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  processPayment,
  getAvailableServices,
  getPatients,
  deleteBill,
  generateInvoice,
  sendWhatsApp
} from '../controllers/billingController.js';

const router = express.Router();

// Bill CRUD operations
router.post('/create', createBill);
router.get('/all', getAllBills);
router.get('/:id', getBillById);
router.delete('/:id', deleteBill);

// Payment processing
router.post('/:id/payment', processPayment);

// Services and patients
router.get('/services/available', getAvailableServices);
router.get('/patients/list', getPatients);

// WhatsApp notification
router.post('/send-whatsapp', sendWhatsApp);

export default router;
