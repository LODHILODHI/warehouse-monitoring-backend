const express = require('express');
const router = express.Router();
const { createStockEntry, getStockEntries, updateStockEntry, deleteStockEntry } = require('../controllers/stock.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdminOrInspector, requireWarehouseAccess, blockPermanentSecretary } = require('../middleware/role.middleware');

// Super admin and inspector can create/update/delete stock entries
// Permanent secretary has read-only access (GET requests only)
router.post('/', authenticate, blockPermanentSecretary, requireSuperAdminOrInspector, requireWarehouseAccess, createStockEntry);
router.get('/:warehouseId', authenticate, requireWarehouseAccess, getStockEntries); // Allow permanent secretary to read
router.put('/entry/:id', authenticate, blockPermanentSecretary, updateStockEntry);
router.patch('/entry/:id', authenticate, blockPermanentSecretary, updateStockEntry);
router.delete('/entry/:id', authenticate, blockPermanentSecretary, deleteStockEntry);

module.exports = router;
