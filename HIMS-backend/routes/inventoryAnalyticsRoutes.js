import express from 'express';
import { getSmartAnalytics } from '../controllers/inventoryAnalyticsController.js';

const router = express.Router();

router.get('/', getSmartAnalytics);

export default router;
