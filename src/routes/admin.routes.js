const express = require('express');
const router = express.Router();
const { getSettings, updateSettingsHandler } = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/role.middleware');

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/settings', getSettings);
router.put('/settings', updateSettingsHandler);

module.exports = router;
