const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getSetting } = require('../services/settings.service');

/**
 * If maintenance mode is on, allow only super_admin. Otherwise next().
 * Skip for POST /login and for /admin/* so super_admin can log in and change settings.
 */
const maintenanceCheck = async (req, res, next) => {
  try {
    const path = req.path || req.originalUrl || '';
    const isLogin = path.endsWith('/login') || path === '/login';
    const isAdminSettings = path.includes('/admin');
    const isPublicSettings = path.includes('settings/public');
    if (isLogin || isAdminSettings || isPublicSettings) {
      return next();
    }

    const mode = await getSetting('maintenance_mode');
    if (mode !== 'true') {
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      const message = await getSetting('maintenance_message');
      return res.status(503).json({
        error: 'Maintenance mode',
        message: message || 'System is under maintenance. Please try again later.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId);
    if (user && user.role === 'super_admin') {
      return next();
    }

    const message = await getSetting('maintenance_message');
    return res.status(503).json({
      error: 'Maintenance mode',
      message: message || 'System is under maintenance. Please try again later.'
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      const message = await getSetting('maintenance_message').catch(() => null);
      return res.status(503).json({
        error: 'Maintenance mode',
        message: message || 'System is under maintenance. Please try again later.'
      });
    }
    next(err);
  }
};

module.exports = { maintenanceCheck };
