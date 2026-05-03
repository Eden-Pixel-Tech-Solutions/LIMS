import express from 'express';
import { getStaffStats, getAllStaff, addStaff, getDoctors } from '../controllers/staffController.js';

const router = express.Router();

router.get('/stats', getStaffStats);
router.get('/list', getAllStaff);
router.get('/doctors', getDoctors);
router.post('/add', addStaff);

export default router;
