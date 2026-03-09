const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login, getMe, updateMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', loginLimiter, login);

// Current user profile (requires authentication)
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);

module.exports = router;
