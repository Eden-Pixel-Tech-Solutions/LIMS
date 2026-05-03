import express from 'express';
import billingPackageController from '../controllers/billingPackageController.js';

const router = express.Router();

// Get all packages (with optional filters)
router.get('/', billingPackageController.getAllPackages);

// Get packages by department
router.get('/department/:department', billingPackageController.getPackagesByDepartment);

// Get single package by ID
router.get('/:id', billingPackageController.getPackageById);

// Create new package
router.post('/', billingPackageController.createPackage);

// Update package
router.put('/:id', billingPackageController.updatePackage);

// Delete package
router.delete('/:id', billingPackageController.deletePackage);

export default router;
