const { AuditLog } = require('../models');

/**
 * Log an audit entry. Call from controllers after successful create/update/delete.
 * @param {object} req - Express request (must have req.user and optionally req.ip)
 * @param {string} action - e.g. 'warehouse_created', 'stock_updated', 'user_deleted'
 * @param {string} entityType - e.g. 'warehouse', 'stock_entry', 'user', 'camera'
 * @param {string} [entityId] - ID of the entity
 * @param {string} [details] - Optional JSON or text details
 */
async function logAudit(req, action, entityType, entityId = null, details = null) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || null;
    await AuditLog.create({
      userId: req.user?.id || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      ipAddress: ip
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

module.exports = { logAudit };
