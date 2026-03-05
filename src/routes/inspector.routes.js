const express = require('express');
const router = express.Router();
const {
  getInspectorDashboard,
  getInspectorStockEntries,
  getInspectorCameras,
  getInspectorWarehouses
} = require('../controllers/inspector.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireInspector } = require('../middleware/role.middleware');

// All inspector routes require authentication and inspector role
router.use(authenticate);
router.use(requireInspector);

/**
 * @route   GET /api/inspector/dashboard
 * @desc    Get inspector dashboard summary
 * @access  Inspector only
 */
router.get('/dashboard', getInspectorDashboard);

/**
 * @route   GET /api/inspector/stock
 * @desc    Get inspector's stock entries (all assigned warehouses)
 * @access  Inspector only
 * @query   type (optional): IN | OUT
 * @query   warehouseId (optional): Filter by specific warehouse
 * @query   page (optional): Page number (default: 1)
 * @query   limit (optional): Items per page (default: 20, max: 100)
 */
router.get('/stock', getInspectorStockEntries);

/**
 * @route   GET /api/inspector/cameras
 * @desc    Get cameras for inspector's assigned warehouses
 * @access  Inspector only
 */
router.get('/cameras', getInspectorCameras);

/**
 * @route   GET /api/inspector/warehouses
 * @desc    Get inspector's assigned warehouses list
 * @access  Inspector only
 */
router.get('/warehouses', getInspectorWarehouses);

module.exports = router;
