const express = require('express');
const router = express.Router();
const { getStockReports, getWarehouseAnalytics } = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/stock', authenticate, getStockReports);
router.get('/warehouse/:warehouseId', authenticate, getWarehouseAnalytics);

module.exports = router;
