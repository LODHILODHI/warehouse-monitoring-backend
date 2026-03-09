const express = require('express');
const router = express.Router();
const { getLoginLogs } = require('../controllers/security.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');

router.get('/login-logs', authenticate, requireSuperAdmin, getLoginLogs);

module.exports = router;
