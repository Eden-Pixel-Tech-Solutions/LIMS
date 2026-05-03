import express from 'express';
import { getDutySchedules, addDutySchedule, deleteDutySchedule, getAvailableDoctors } from '../controllers/dutyController.js';

const router = express.Router();

router.get('/', getDutySchedules);
router.get('/available', getAvailableDoctors);
router.post('/add', addDutySchedule);
router.delete('/:id', deleteDutySchedule);

export default router;
