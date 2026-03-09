const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/audit-logs
 * Super admin only. Query: action, entityType, entityId, userId, limit, from, to
 */
const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, entityId, userId, limit = 50, from, to } = req.query;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }

    const logs = await AuditLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 50, 200)
    });

    res.json({ auditLogs: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAuditLogs };
