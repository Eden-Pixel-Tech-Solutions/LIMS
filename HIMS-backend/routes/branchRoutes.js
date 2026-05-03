import express from 'express';
import { 
  getBranches, 
  createDistrict, 
  updateDistrict,
  deleteDistrict,
  createCenter,
  updateCenter,
  deleteCenter,
  createFacilityCategory,
  updateFacilityCategory,
  deleteFacilityCategory
} from '../controllers/branchController.js';

const router = express.Router();

router.get('/', getBranches);
router.post('/district', createDistrict);
router.put('/district/:id', updateDistrict);
router.delete('/district/:id', deleteDistrict);

router.post('/center', createCenter);
router.put('/center/:id', updateCenter);
router.delete('/center/:id', deleteCenter);

router.post('/categories', createFacilityCategory);
router.put('/categories/:id', updateFacilityCategory);
router.delete('/categories/:id', deleteFacilityCategory);

export default router;
