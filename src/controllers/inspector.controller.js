const inspectorService = require('../services/inspector.service');

/**
 * Get inspector dashboard
 * GET /api/inspector/dashboard
 */
const getInspectorDashboard = async (req, res) => {
  try {
    const inspectorId = req.user.id;

    const dashboard = await inspectorService.getInspectorDashboard(inspectorId);

    res.json(dashboard);
  } catch (error) {
    console.error('Get inspector dashboard error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get inspector's stock entries
 * GET /api/inspector/stock?type=IN&warehouseId=uuid&page=1&limit=20
 */
const getInspectorStockEntries = async (req, res) => {
  try {
    const inspectorId = req.user.id;
    const { type, warehouseId, page, limit } = req.query;

    const filters = {
      type,
      warehouseId,
      page,
      limit
    };

    const result = await inspectorService.getInspectorStockEntries(inspectorId, filters);

    res.json(result);
  } catch (error) {
    console.error('Get inspector stock entries error:', error);
    
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get inspector's assigned warehouse cameras
 * GET /api/inspector/cameras
 */
const getInspectorCameras = async (req, res) => {
  try {
    const inspectorId = req.user.id;

    const cameras = await inspectorService.getInspectorCameras(inspectorId);

    res.json(cameras);
  } catch (error) {
    console.error('Get inspector cameras error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Get inspector's assigned warehouses
 * GET /api/inspector/warehouses
 */
const getInspectorWarehouses = async (req, res) => {
  try {
    const inspectorId = req.user.id;

    const warehouses = await inspectorService.getAssignedWarehouses(inspectorId);

    res.json({
      warehouses,
      count: warehouses.length
    });
  } catch (error) {
    console.error('Get inspector warehouses error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = {
  getInspectorDashboard,
  getInspectorStockEntries,
  getInspectorCameras,
  getInspectorWarehouses
};
