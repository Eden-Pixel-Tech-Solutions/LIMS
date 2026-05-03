import express from 'express';
import {
  getInvoices,
  createInvoice,
  createPayment,
  getDashboardStats,
  getSupplierLedger
} from '../controllers/inventoryAccountsPayableController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.post('/payments', createPayment);
router.get('/ledger/:vendor_id', getSupplierLedger);

export default router;
