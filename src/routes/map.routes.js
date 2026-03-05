const express = require('express');
const router = express.Router();
const { getMapWarehouses } = require('../controllers/map.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdminOrPermanentSecretary } = require('../middleware/role.middleware');

// Get all warehouses for map display (super_admin and permanent_secretary only)
router.get('/warehouses', authenticate, requireSuperAdminOrPermanentSecretary, getMapWarehouses);

module.exports = router;
