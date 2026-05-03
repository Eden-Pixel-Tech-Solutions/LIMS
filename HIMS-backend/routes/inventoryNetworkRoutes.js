import express from 'express';
import {
  getCentralInventoryStats,
  getSubCentralInventoryStats,
  getBranchInventoryStats,
  getOverallStock,
} from '../controllers/inventoryNetworkController.js';

const router = express.Router();

router.get('/central',     getCentralInventoryStats);
router.get('/sub-central', getSubCentralInventoryStats);
router.get('/branch',      getBranchInventoryStats);
router.get('/overall',     getOverallStock);

export default router;
