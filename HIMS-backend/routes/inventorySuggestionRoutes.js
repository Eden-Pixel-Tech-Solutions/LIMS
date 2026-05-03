import express from 'express';
import {
  getPurchaseSuggestions,
  generatePurchaseSuggestions,
  updateSuggestionStatus
} from '../controllers/inventorySuggestionController.js';

const router = express.Router();

router.get('/', getPurchaseSuggestions);
router.post('/generate', generatePurchaseSuggestions);
router.put('/:id', updateSuggestionStatus);

export default router;
