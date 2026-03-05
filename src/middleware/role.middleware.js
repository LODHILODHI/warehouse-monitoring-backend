const { InspectorWarehouse } = require('../models');

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin role required.' });
  }
  next();
};

const requireInspector = (req, res, next) => {
  if (req.user.role !== 'inspector') {
    return res.status(403).json({ error: 'Access denied. Inspector role required.' });
  }
  next();
};

/**
 * Allow access to super_admin and inspector
 * Used for stock entry routes where both roles can create entries
 */
const requireSuperAdminOrInspector = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'inspector') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin or inspector role required.' 
    });
  }
  next();
};

/**
 * Allow access to super_admin and permanent_secretary
 * Used for map and camera viewing routes
 */
const requireSuperAdminOrPermanentSecretary = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'permanent_secretary') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin or permanent secretary role required.' 
    });
  }
  next();
};

/**
 * Block permanent_secretary from accessing the route
 * Used for routes that permanent_secretary should not access
 */
const blockPermanentSecretary = (req, res, next) => {
  if (req.user.role === 'permanent_secretary') {
    return res.status(403).json({ 
      error: 'Access denied. Permanent secretary does not have permission for this action.' 
    });
  }
  next();
};

const requireWarehouseAccess = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Safely get warehouseId from body, params, or query
    let warehouseId = null;
    if (req.body && typeof req.body === 'object' && req.body.warehouseId) {
      warehouseId = req.body.warehouseId;
    } else if (req.params && typeof req.params === 'object') {
      // Check for warehouseId or id in params (warehouse routes use :id)
      warehouseId = req.params.warehouseId || req.params.id;
    } else if (req.query && typeof req.query === 'object' && req.query.warehouseId) {
      warehouseId = req.query.warehouseId;
    }

    if (!warehouseId) {
      console.log('Warehouse ID not found. Request details:', {
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query
      });
      return res.status(400).json({ error: 'Warehouse ID is required' });
    }

    // Super admin has access to all warehouses
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Permanent secretary has read-only access to all warehouses (for viewing)
    if (req.user.role === 'permanent_secretary') {
      // Only allow GET requests (read-only)
      if (req.method === 'GET') {
        return next();
      }
      // Block write operations
      return res.status(403).json({ 
        error: 'Access denied. Permanent secretary has read-only access.' 
      });
    }

    // For inspectors, check if they are assigned to this warehouse
    if (req.user.role === 'inspector') {
      const assignment = await InspectorWarehouse.findOne({
        where: {
          userId: req.user.id,
          warehouseId: warehouseId
        }
      });

      if (!assignment) {
        return res.status(403).json({ 
          error: 'Access denied. You are not assigned to this warehouse.' 
        });
      }

      return next();
    }

    // If user has none of the allowed roles
    return res.status(403).json({ 
      error: 'Access denied. Insufficient permissions.' 
    });
  } catch (error) {
    console.error('Error in requireWarehouseAccess:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      warehouseId: req.body?.warehouseId || req.params?.warehouseId || req.query?.warehouseId
    });
    return res.status(500).json({ 
      error: 'Error checking warehouse access',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requireSuperAdmin,
  requireInspector,
  requireSuperAdminOrInspector,
  requireSuperAdminOrPermanentSecretary,
  blockPermanentSecretary,
  requireWarehouseAccess
};
