const express = require('express');
const router = express.Router();
const { createCamera, getCameras, getCameraById, updateCamera, deleteCamera } = require('../controllers/camera.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdmin, blockPermanentSecretary } = require('../middleware/role.middleware');

// All camera routes require authentication
router.use(authenticate);

// Create camera (Super Admin only - block permanent_secretary)
router.post('/', requireSuperAdmin, blockPermanentSecretary, createCamera);

// Get all cameras (with optional warehouseId query) - accessible to all authenticated users including permanent_secretary
router.get('/', getCameras);

// Get camera by ID - accessible to all authenticated users including permanent_secretary
router.get('/:id', getCameraById);

// Update camera (Super Admin only - block permanent_secretary)
router.put('/:id', requireSuperAdmin, blockPermanentSecretary, updateCamera);
router.patch('/:id', requireSuperAdmin, blockPermanentSecretary, updateCamera);

// Delete camera (Super Admin only - block permanent_secretary)
router.delete('/:id', requireSuperAdmin, blockPermanentSecretary, deleteCamera);

module.exports = router;
