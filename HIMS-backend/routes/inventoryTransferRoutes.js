import express from 'express';
import {
  getTransfers,
  createTransfer,
  updateTransferStatus
} from '../controllers/inventoryTransferController.js';

const router = express.Router();

router.get('/', getTransfers);
router.post('/', createTransfer);
router.put('/:id/status', updateTransferStatus);

export default router;
