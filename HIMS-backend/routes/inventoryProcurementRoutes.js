import express from 'express';
import {
  getPRs,
  createPR,
  updatePRStatus,
  getPOs,
  createPO,
  updatePOStatus,
  sendPOByEmail
} from '../controllers/inventoryProcurementController.js';

const router = express.Router();

router.get('/requisitions', getPRs);
router.post('/requisitions', createPR);
router.put('/requisitions/:id/status', updatePRStatus);

router.get('/orders', getPOs);
router.post('/orders', createPO);
router.put('/orders/:id/status', updatePOStatus);
router.post('/orders/:id/send-email', sendPOByEmail);

export default router;
