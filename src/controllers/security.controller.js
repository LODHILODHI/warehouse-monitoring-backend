const { LoginLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/security/login-logs
 * Super admin only. Returns recent login activity with optional filters.
 */
const getLoginLogs = async (req, res) => {
  try {
    const { userId, limit = 50, from, to } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (from || to) {
      where.loginAt = {};
      if (from) where.loginAt[Op.gte] = new Date(from);
      if (to) where.loginAt[Op.lte] = new Date(to);
    }

    const logs = await LoginLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['loginAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 50, 200)
    });

    res.json({ loginLogs: logs });
  } catch (error) {
    console.error('Get login logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getLoginLogs };
