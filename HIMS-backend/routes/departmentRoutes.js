import express from 'express';
import departmentController from '../controllers/departmentController.js';

const router = express.Router();

// Get all departments (with optional filters)
router.get('/', departmentController.getAllDepartments);

// Get single department by ID
router.get('/:id', departmentController.getDepartmentById);

// Create new department
router.post('/', departmentController.createDepartment);

// Update department
router.put('/:id', departmentController.updateDepartment);

// Delete department
router.delete('/:id', departmentController.deleteDepartment);

export default router;
