import express from 'express';
import { register, login } from '../controllers/authController.js';

import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register); // Temporarily removed: authenticateToken, authorizeRole(['Admin', 'Lab Head', 'Doctor'])
router.post('/login', login);

export default router;
