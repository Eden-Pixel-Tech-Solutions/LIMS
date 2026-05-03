import express from 'express';
import { getInfraList, addInfra, updateInfra, deleteInfra } from '../controllers/infraController.js';

const router = express.Router();

router.get('/', getInfraList);
router.post('/add', addInfra);
router.put('/update/:id', updateInfra);
router.delete('/delete/:id', deleteInfra);

export default router;
