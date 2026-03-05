const express = require('express');
const router = express.Router();
const { 
  createWarehouse, 
  getWarehouses, 
  getWarehouseById, 
  updateWarehouse, 
  deleteWarehouse, 
  getWarehouseCameras, 
  getWarehouseStats, 
  getWarehouseRecentEntries, 
  getWarehouseInventory,
  getWarehouseStockTrends,
  getWarehouseTopItems,
  getWarehouseActivityTimeline,
  getWarehouseStockDistribution,
  getWarehouseComparison,
  getWarehouseCameraStatusHistory,
  getWarehouseInspectorActivity
} = require('../controllers/warehouse.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireSuperAdminOrPermanentSecretary, blockPermanentSecretary, requireWarehouseAccess } = require('../middleware/role.middleware');

// Create warehouse - super_admin only (block permanent_secretary)
router.post('/', authenticate, requireSuperAdmin, blockPermanentSecretary, createWarehouse);

// Get all warehouses - all authenticated users can view
router.get('/', authenticate, getWarehouses);

// Get warehouse cameras - all authenticated users with warehouse access (including inspectors)
// IMPORTANT: These routes must come before /:id to avoid route conflicts
router.get('/:id/cameras', authenticate, requireWarehouseAccess, getWarehouseCameras);
router.get('/:id/stats', authenticate, requireWarehouseAccess, getWarehouseStats);
router.get('/:id/recent-entries', authenticate, requireWarehouseAccess, getWarehouseRecentEntries);
router.get('/:id/inventory', authenticate, requireWarehouseAccess, getWarehouseInventory);
router.get('/:id/stock-trends', authenticate, getWarehouseStockTrends);
router.get('/:id/top-items', authenticate, getWarehouseTopItems);
router.get('/:id/activity-timeline', authenticate, getWarehouseActivityTimeline);
router.get('/:id/stock-distribution', authenticate, getWarehouseStockDistribution);
router.get('/:id/comparison', authenticate, getWarehouseComparison);
router.get('/:id/camera-status-history', authenticate, getWarehouseCameraStatusHistory);
router.get('/:id/inspector-activity', authenticate, getWarehouseInspectorActivity);

// Get warehouse by ID - all authenticated users can view
router.get('/:id', authenticate, getWarehouseById);

// Update warehouse - super_admin only (block permanent_secretary)
router.put('/:id', authenticate, requireSuperAdmin, blockPermanentSecretary, updateWarehouse);
router.patch('/:id', authenticate, requireSuperAdmin, blockPermanentSecretary, updateWarehouse);

// Delete warehouse - super_admin only (block permanent_secretary)
router.delete('/:id', authenticate, requireSuperAdmin, blockPermanentSecretary, deleteWarehouse);

module.exports = router;
