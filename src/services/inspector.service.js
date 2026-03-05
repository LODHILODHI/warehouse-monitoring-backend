const { User, Warehouse, InspectorWarehouse, StockEntry, Camera } = require('../models');
const { Op } = require('sequelize');

/**
 * Get inspector's assigned warehouses
 */
const getAssignedWarehouses = async (inspectorId) => {
  const assignments = await InspectorWarehouse.findAll({
    where: { userId: inspectorId },
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'status']
      }
    ]
  });

  return assignments.map(assignment => ({
    id: assignment.warehouse.id,
    name: assignment.warehouse.name,
    address: assignment.warehouse.address,
    latitude: assignment.warehouse.latitude,
    longitude: assignment.warehouse.longitude,
    status: assignment.warehouse.status,
    assignedAt: assignment.createdAt
  }));
};

/**
 * Get inspector's warehouse IDs
 */
const getInspectorWarehouseIds = async (inspectorId) => {
  const assignments = await InspectorWarehouse.findAll({
    where: { userId: inspectorId },
    attributes: ['warehouseId']
  });

  return assignments.map(a => a.warehouseId);
};

/**
 * Get inspector dashboard summary
 */
const getInspectorDashboard = async (inspectorId) => {
  // Get inspector info
  const inspector = await User.findByPk(inspectorId, {
    attributes: ['id', 'name', 'email', 'role', 'createdAt']
  });

  if (!inspector) {
    throw new Error('Inspector not found');
  }

  // Get assigned warehouses
  const assignedWarehouses = await getAssignedWarehouses(inspectorId);
  const warehouseIds = assignedWarehouses.map(w => w.id);

  if (warehouseIds.length === 0) {
    return {
      inspector: {
        id: inspector.id,
        name: inspector.name,
        email: inspector.email,
        role: inspector.role,
        createdAt: inspector.createdAt
      },
      assignedWarehouses: [],
      statistics: {
        totalStockIn: 0,
        totalStockOut: 0,
        netStock: 0,
        totalEntries: 0,
        entriesToday: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0
      },
      recentActivity: []
    };
  }

  // Date calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all stock entries for assigned warehouses
  const allEntries = await StockEntry.findAll({
    where: { warehouseId: { [Op.in]: warehouseIds } },
    attributes: ['type', 'quantity', 'createdAt']
  });

  // Calculate statistics
  const totalStockIn = allEntries
    .filter(e => e.type === 'IN')
    .reduce((sum, e) => sum + e.quantity, 0);

  const totalStockOut = allEntries
    .filter(e => e.type === 'OUT')
    .reduce((sum, e) => sum + e.quantity, 0);

  const netStock = totalStockIn - totalStockOut;

  // Count entries by period
  const entriesToday = allEntries.filter(e => 
    e.createdAt >= startOfToday && e.createdAt <= endOfToday
  ).length;

  const entriesThisWeek = allEntries.filter(e => 
    e.createdAt >= startOfWeek
  ).length;

  const entriesThisMonth = allEntries.filter(e => 
    e.createdAt >= startOfMonth
  ).length;

  // Get recent activity (last 10 entries)
  const recentActivity = await StockEntry.findAll({
    where: { warehouseId: { [Op.in]: warehouseIds } },
    limit: 10,
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return {
    inspector: {
      id: inspector.id,
      name: inspector.name,
      email: inspector.email,
      role: inspector.role,
      createdAt: inspector.createdAt
    },
    assignedWarehouses: assignedWarehouses,
    statistics: {
      totalStockIn,
      totalStockOut,
      netStock,
      totalEntries: allEntries.length,
      entriesToday,
      entriesThisWeek,
      entriesThisMonth
    },
    recentActivity: recentActivity.map(entry => ({
      id: entry.id,
      itemName: entry.itemName,
      type: entry.type,
      quantity: entry.quantity,
      notes: entry.notes,
      warehouse: {
        id: entry.warehouse.id,
        name: entry.warehouse.name
      },
      createdAt: entry.createdAt
    }))
  };
};

/**
 * Get inspector's stock entries
 */
const getInspectorStockEntries = async (inspectorId, filters = {}) => {
  const { type, warehouseId, page = 1, limit = 20 } = filters;

  // Get assigned warehouse IDs
  const warehouseIds = await getInspectorWarehouseIds(inspectorId);

  if (warehouseIds.length === 0) {
    return {
      entries: [],
      pagination: {
        page: 1,
        limit: parseInt(limit),
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }

  // Build where clause
  const whereClause = { warehouseId: { [Op.in]: warehouseIds } };

  // Filter by specific warehouse (if provided and inspector has access)
  if (warehouseId) {
    if (!warehouseIds.includes(warehouseId)) {
      throw new Error('Access denied. You are not assigned to this warehouse.');
    }
    whereClause.warehouseId = warehouseId;
  }

  // Filter by type
  if (type && ['IN', 'OUT'].includes(type.toUpperCase())) {
    whereClause.type = type.toUpperCase();
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // Get total count
  const totalItems = await StockEntry.count({ where: whereClause });

  // Get entries
  const entries = await StockEntry.findAll({
    where: whereClause,
    limit: limitNum,
    offset: offset,
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name', 'address']
      },
      {
        model: User,
        as: 'inspector',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const totalPages = Math.ceil(totalItems / limitNum);

  return {
    entries: entries.map(entry => ({
      id: entry.id,
      itemName: entry.itemName,
      type: entry.type,
      quantity: entry.quantity,
      notes: entry.notes,
      warehouse: {
        id: entry.warehouse.id,
        name: entry.warehouse.name,
        address: entry.warehouse.address
      },
      inspector: {
        id: entry.inspector.id,
        name: entry.inspector.name,
        email: entry.inspector.email
      },
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalItems,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  };
};

/**
 * Get inspector's assigned warehouse cameras
 */
const getInspectorCameras = async (inspectorId) => {
  // Get assigned warehouse IDs
  const warehouseIds = await getInspectorWarehouseIds(inspectorId);

  if (warehouseIds.length === 0) {
    return {
      cameras: [],
      warehouses: []
    };
  }

  // Get warehouses with cameras
  const warehouses = await Warehouse.findAll({
    where: { id: { [Op.in]: warehouseIds } },
    include: [
      {
        model: Camera,
        as: 'cameras',
        attributes: ['id', 'name', 'streamUrl', 'status', 'createdAt', 'updatedAt']
      }
    ],
    attributes: ['id', 'name', 'address', 'status']
  });

  // Format response
  const formattedWarehouses = warehouses.map(warehouse => ({
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address,
    status: warehouse.status,
    cameras: warehouse.cameras.map(camera => ({
      id: camera.id,
      name: camera.name,
      streamUrl: camera.streamUrl,
      status: camera.status,
      createdAt: camera.createdAt,
      updatedAt: camera.updatedAt
    }))
  }));

  // Flatten cameras for easy access
  const allCameras = warehouses.flatMap(warehouse => 
    warehouse.cameras.map(camera => ({
      id: camera.id,
      name: camera.name,
      streamUrl: camera.streamUrl,
      status: camera.status,
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      createdAt: camera.createdAt,
      updatedAt: camera.updatedAt
    }))
  );

  return {
    cameras: allCameras,
    warehouses: formattedWarehouses,
    summary: {
      total: allCameras.length,
      online: allCameras.filter(c => c.status === 'online').length,
      offline: allCameras.filter(c => c.status === 'offline').length
    }
  };
};

module.exports = {
  getAssignedWarehouses,
  getInspectorWarehouseIds,
  getInspectorDashboard,
  getInspectorStockEntries,
  getInspectorCameras
};
