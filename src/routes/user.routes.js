const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireSuperAdmin, requireSuperAdminOrPermanentSecretary } = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// GET routes: Allow super admin and permanent secretary (read-only)
router.get('/', requireSuperAdminOrPermanentSecretary, getUsers);
router.get('/:id', requireSuperAdminOrPermanentSecretary, getUserById);

// Write operations: Only super admin
router.post('/', requireSuperAdmin, createUser);
router.put('/:id', requireSuperAdmin, updateUser);
router.patch('/:id', requireSuperAdmin, updateUser);
router.delete('/:id', requireSuperAdmin, deleteUser);

module.exports = router;
