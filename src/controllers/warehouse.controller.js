const { Warehouse, Camera, InspectorWarehouse, User, StockEntry } = require('../models');
const { logAudit } = require('../utils/auditHelper');

const createWarehouse = async (req, res) => {
  try {
    const { name, latitude, longitude, address, status, capacity } = req.body;

    if (!name || !latitude || !longitude || !address) {
      return res.status(400).json({ 
        error: 'Name, latitude, longitude, and address are required' 
      });
    }

    const warehouse = await Warehouse.create({
      name,
      latitude,
      longitude,
      address,
      status: status || 'active',
      capacity: capacity != null ? parseInt(capacity, 10) : null
    });

    await logAudit(req, 'warehouse_created', 'warehouse', warehouse.id, { name: warehouse.name });

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getWarehouses = async (req, res) => {
  try {
    console.log('Getting warehouses for user:', req.user?.email);
    
    const { Op } = require('sequelize');
    let whereClause = {};
    
    // If inspector, only show assigned warehouses
    if (req.user.role === 'inspector') {
      const assignments = await InspectorWarehouse.findAll({
        where: { userId: req.user.id },
        attributes: ['warehouseId']
      });
      const warehouseIds = assignments.map(a => a.warehouseId);
      
      if (warehouseIds.length === 0) {
        // Inspector has no assigned warehouses
        return res.json({ warehouses: [] });
      }
      
      whereClause.id = { [Op.in]: warehouseIds };
    }
    // super_admin and permanent_secretary can see all warehouses (no filter)
    
    const warehouses = await Warehouse.findAll({
      where: whereClause,
      include: [
        {
          model: InspectorWarehouse,
          as: 'inspectors',
          required: false, // LEFT JOIN - include warehouses even if no inspectors assigned
          include: [
            {
              model: User,
              as: 'inspector',
              attributes: ['id', 'name', 'email', 'role']
            }
          ]
        },
        {
          model: Camera,
          as: 'cameras',
          required: false,
          attributes: ['id', 'name', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format response to include assigned inspectors
    const formattedWarehouses = warehouses.map(warehouse => {
      const warehouseJson = warehouse.toJSON();
      const assignedInspectors = warehouseJson.inspectors || [];
      
      return {
        id: warehouseJson.id,
        name: warehouseJson.name,
        latitude: warehouseJson.latitude,
        longitude: warehouseJson.longitude,
        address: warehouseJson.address,
        status: warehouseJson.status,
        capacity: warehouseJson.capacity,
        createdAt: warehouseJson.createdAt,
        updatedAt: warehouseJson.updatedAt,
        assignedInspectors: assignedInspectors.map(iw => ({
          id: iw.inspector.id,
          name: iw.inspector.name,
          email: iw.inspector.email,
          role: iw.inspector.role
        })),
        assignedInspectorsCount: assignedInspectors.length,
        camerasCount: warehouseJson.cameras ? warehouseJson.cameras.length : 0
      };
    });

    console.log(`Found ${formattedWarehouses.length} warehouses`);
    res.json({ warehouses: formattedWarehouses });
  } catch (error) {
    console.error('Get warehouses error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id, {
      include: [
        {
          model: Camera,
          as: 'cameras',
          attributes: ['id', 'name', 'streamUrl', 'status']
        },
        {
          model: InspectorWarehouse,
          as: 'inspectors',
          required: false,
          include: [
            {
              model: User,
              as: 'inspector',
              attributes: ['id', 'name', 'email', 'role']
            }
          ]
        }
      ]
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Format response to include assigned inspectors
    const warehouseJson = warehouse.toJSON();
    const assignedInspectors = warehouseJson.inspectors || [];

    const formattedWarehouse = {
      id: warehouseJson.id,
      name: warehouseJson.name,
      latitude: warehouseJson.latitude,
      longitude: warehouseJson.longitude,
      address: warehouseJson.address,
      status: warehouseJson.status,
      capacity: warehouseJson.capacity,
      createdAt: warehouseJson.createdAt,
      updatedAt: warehouseJson.updatedAt,
      cameras: warehouseJson.cameras || [],
      assignedInspectors: assignedInspectors.map(iw => ({
        id: iw.inspector.id,
        name: iw.inspector.name,
        email: iw.inspector.email,
        role: iw.inspector.role
      })),
      assignedInspectorsCount: assignedInspectors.length
    };

    res.json({ warehouse: formattedWarehouse });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, address, status, capacity } = req.body;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Update only provided fields
    if (name !== undefined) warehouse.name = name;
    if (latitude !== undefined) warehouse.latitude = latitude;
    if (longitude !== undefined) warehouse.longitude = longitude;
    if (address !== undefined) warehouse.address = address;
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Status must be active or inactive' });
      }
      warehouse.status = status;
    }
    if (capacity !== undefined) warehouse.capacity = capacity == null ? null : parseInt(capacity, 10);

    await warehouse.save();

    await logAudit(req, 'warehouse_updated', 'warehouse', warehouse.id, { name: warehouse.name });

    res.json({
      message: 'Warehouse updated successfully',
      warehouse
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const warehouseName = warehouse.name;
    await warehouse.destroy();

    await logAudit(req, 'warehouse_deleted', 'warehouse', id, { name: warehouseName });

    res.json({
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all cameras for a specific warehouse
 * Accessible by: super_admin, permanent_secretary
 * Returns: camera id, name, streamUrl, status
 */
const getWarehouseCameras = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const cameras = await Camera.findAll({
      where: { warehouseId: id },
      attributes: ['id', 'name', 'streamUrl', 'status'],
      order: [['name', 'ASC']]
    });

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      cameras: cameras.map(camera => ({
        id: camera.id,
        name: camera.name,
        streamUrl: camera.streamUrl,
        status: camera.status
      }))
    });
  } catch (error) {
    console.error('Get warehouse cameras error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get warehouse statistics
 * Returns: stock entries counts, IN/OUT totals, cameras count, inspectors count
 */
const getWarehouseStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { Op } = require('sequelize');

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stock entries counts
    const totalEntries = await StockEntry.count({ where: { warehouseId: id } });
    const entriesToday = await StockEntry.count({
      where: {
        warehouseId: id,
        createdAt: { [Op.gte]: startOfToday }
      }
    });
    const entriesThisWeek = await StockEntry.count({
      where: {
        warehouseId: id,
        createdAt: { [Op.gte]: startOfWeek }
      }
    });
    const entriesThisMonth = await StockEntry.count({
      where: {
        warehouseId: id,
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // IN vs OUT totals
    const allEntries = await StockEntry.findAll({
      where: { warehouseId: id },
      attributes: ['type', 'quantity']
    });

    const totalIn = allEntries
      .filter(e => e.type === 'IN')
      .reduce((sum, e) => sum + e.quantity, 0);
    
    const totalOut = allEntries
      .filter(e => e.type === 'OUT')
      .reduce((sum, e) => sum + e.quantity, 0);

    const netStock = totalIn - totalOut;

    // Cameras count
    const totalCameras = await Camera.count({ where: { warehouseId: id } });
    const onlineCameras = await Camera.count({
      where: {
        warehouseId: id,
        status: 'online'
      }
    });

    // Inspectors count
    const assignedInspectorsCount = await InspectorWarehouse.count({
      where: { warehouseId: id }
    });

    // Last activity
    const lastEntry = await StockEntry.findOne({
      where: { warehouseId: id },
      order: [['createdAt', 'DESC']],
      attributes: ['createdAt']
    });

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      statistics: {
        stockEntries: {
          total: totalEntries,
          today: entriesToday,
          thisWeek: entriesThisWeek,
          thisMonth: entriesThisMonth
        },
        stockSummary: {
          totalIn,
          totalOut,
          netStock
        },
        cameras: {
          total: totalCameras,
          online: onlineCameras,
          offline: totalCameras - onlineCameras
        },
        inspectors: {
          assigned: assignedInspectorsCount
        },
        lastActivity: lastEntry ? lastEntry.createdAt : null
      }
    });
  } catch (error) {
    console.error('Get warehouse stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get recent stock entries for a warehouse
 * Returns: recent stock entries with inspector details
 * Query params: limit (default: 10), inspectorId (optional), type (optional: IN/OUT), myEntries (optional: true)
 */
const getWarehouseRecentEntries = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, inspectorId, type, myEntries } = req.query;

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Build where clause
    const whereClause = { warehouseId: id };
    
    // Filter by inspector
    if (myEntries === 'true' && req.user.role === 'inspector') {
      // If myEntries=true, filter by logged-in inspector
      whereClause.inspectorId = req.user.id;
    } else if (inspectorId) {
      // If inspectorId provided, filter by that inspector
      // Super admin and permanent secretary can filter by any inspector
      // Inspector can only filter by themselves
      if (req.user.role === 'inspector' && inspectorId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only filter by your own entries.' 
        });
      }
      whereClause.inspectorId = inspectorId;
    }
    
    // Filter by type (IN/OUT)
    if (type && ['IN', 'OUT'].includes(type.toUpperCase())) {
      whereClause.type = type.toUpperCase();
    }

    const recentEntries = await StockEntry.findAll({
      where: whereClause,
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10)),
      include: [
        {
          model: User,
          as: 'inspector',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      recentEntries: recentEntries.map(entry => ({
        id: entry.id,
        itemName: entry.itemName,
        type: entry.type,
        quantity: entry.quantity,
        notes: entry.notes,
        inspector: {
          id: entry.inspector.id,
          name: entry.inspector.name,
          email: entry.inspector.email
        },
        createdAt: entry.createdAt
      })),
      count: recentEntries.length,
      filters: {
        inspectorId: whereClause.inspectorId || null,
        type: whereClause.type || null,
        myEntries: myEntries === 'true' || null
      }
    });
  } catch (error) {
    console.error('Get warehouse recent entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get inventory summary for a warehouse
 * Returns: items grouped by name with IN/OUT totals and net stock
 * Query params: page (default: 1), limit (default: 10, max: 100)
 */
const getWarehouseInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const allEntries = await StockEntry.findAll({
      where: { warehouseId: id },
      attributes: ['itemName', 'type', 'quantity']
    });

    // Group by item name
    const inventoryMap = {};
    allEntries.forEach(entry => {
      if (!inventoryMap[entry.itemName]) {
        inventoryMap[entry.itemName] = {
          itemName: entry.itemName,
          totalIn: 0,
          totalOut: 0,
          netStock: 0,
          entryCount: 0
        };
      }
      
      if (entry.type === 'IN') {
        inventoryMap[entry.itemName].totalIn += entry.quantity;
      } else {
        inventoryMap[entry.itemName].totalOut += entry.quantity;
      }
      
      inventoryMap[entry.itemName].entryCount += 1;
    });

    // Calculate net stock and sort
    const allInventory = Object.values(inventoryMap).map(item => ({
      ...item,
      netStock: item.totalIn - item.totalOut
    })).sort((a, b) => b.netStock - a.netStock);

    // Identify low stock items (netStock < 10)
    const lowStockItems = allInventory.filter(item => item.netStock < 10);

    // Apply pagination
    const totalItems = allInventory.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const paginatedItems = allInventory.slice(offset, offset + limitNum);

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      inventory: {
        items: paginatedItems,
        totalItems: totalItems,
        lowStockItems: lowStockItems.length,
        lowStockAlerts: lowStockItems.map(item => ({
          itemName: item.itemName,
          netStock: item.netStock,
          alert: 'Low stock'
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages,
          totalItems: totalItems,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get warehouse inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get stock trends over time (for line/area charts)
 * Query params: period (week|month|year), default: month
 */
const getWarehouseStockTrends = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    const { Op } = require('sequelize');

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const stockEntries = await StockEntry.findAll({
      where: {
        warehouseId: id,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['type', 'quantity', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    // Group by date
    const trendsByDate = {};
    stockEntries.forEach(entry => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = { in: 0, out: 0, net: 0 };
      }
      if (entry.type === 'IN') {
        trendsByDate[date].in += entry.quantity;
      } else {
        trendsByDate[date].out += entry.quantity;
      }
      trendsByDate[date].net = trendsByDate[date].in - trendsByDate[date].out;
    });

    // Convert to array and sort
    const trends = Object.keys(trendsByDate)
      .sort()
      .map(date => ({
        date,
        in: trendsByDate[date].in,
        out: trendsByDate[date].out,
        net: trendsByDate[date].net
      }));

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      trends,
      period
    });
  } catch (error) {
    console.error('Get warehouse stock trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get top items by quantity (for bar chart)
 * Query params: limit (default: 10)
 */
const getWarehouseTopItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const allEntries = await StockEntry.findAll({
      where: { warehouseId: id },
      attributes: ['itemName', 'type', 'quantity']
    });

    // Group by item name
    const itemsMap = {};
    allEntries.forEach(entry => {
      if (!itemsMap[entry.itemName]) {
        itemsMap[entry.itemName] = {
          itemName: entry.itemName,
          totalIn: 0,
          totalOut: 0,
          netStock: 0,
          entryCount: 0
        };
      }
      
      if (entry.type === 'IN') {
        itemsMap[entry.itemName].totalIn += entry.quantity;
      } else {
        itemsMap[entry.itemName].totalOut += entry.quantity;
      }
      
      itemsMap[entry.itemName].entryCount += 1;
    });

    // Calculate net stock and sort by net stock
    const topItems = Object.values(itemsMap)
      .map(item => ({
        ...item,
        netStock: item.totalIn - item.totalOut
      }))
      .sort((a, b) => b.netStock - a.netStock)
      .slice(0, parseInt(limit));

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      topItems
    });
  } catch (error) {
    console.error('Get warehouse top items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get activity timeline (for timeline chart)
 * Query params: days (default: 7)
 */
const getWarehouseActivityTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    const { Op } = require('sequelize');

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get stock entries grouped by date
    const stockEntries = await StockEntry.findAll({
      where: {
        warehouseId: id,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt', 'inspectorId'],
      include: [
        {
          model: User,
          as: 'inspector',
          attributes: ['id']
        }
      ]
    });

    // Get unique inspectors count
    const inspectorsCount = await InspectorWarehouse.count({
      where: { warehouseId: id }
    });

    // Get cameras count
    const camerasCount = await Camera.count({
      where: { warehouseId: id }
    });

    // Group by date
    const timelineByDate = {};
    stockEntries.forEach(entry => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!timelineByDate[date]) {
        timelineByDate[date] = {
          date,
          entries: 0,
          inspectors: new Set(),
          cameras: camerasCount
        };
      }
      timelineByDate[date].entries += 1;
      if (entry.inspector) {
        timelineByDate[date].inspectors.add(entry.inspector.id);
      }
    });

    // Convert to array
    const timeline = Object.keys(timelineByDate)
      .sort()
      .map(date => ({
        date,
        entries: timelineByDate[date].entries,
        inspectors: timelineByDate[date].inspectors.size || inspectorsCount,
        cameras: timelineByDate[date].cameras
      }));

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      timeline
    });
  } catch (error) {
    console.error('Get warehouse activity timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get stock distribution (for pie/doughnut chart)
 */
const getWarehouseStockDistribution = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const stockEntries = await StockEntry.findAll({
      where: { warehouseId: id },
      attributes: ['type']
    });

    const inCount = stockEntries.filter(e => e.type === 'IN').length;
    const outCount = stockEntries.filter(e => e.type === 'OUT').length;
    const total = stockEntries.length;

    const distribution = [
      {
        type: 'IN',
        count: inCount,
        percentage: total > 0 ? parseFloat(((inCount / total) * 100).toFixed(1)) : 0
      },
      {
        type: 'OUT',
        count: outCount,
        percentage: total > 0 ? parseFloat(((outCount / total) * 100).toFixed(1)) : 0
      }
    ];

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      distribution
    });
  } catch (error) {
    console.error('Get warehouse stock distribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get weekly/monthly comparison (for comparison chart)
 * Query params: period (week|month), default: month
 */
const getWarehouseComparison = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    const { Op } = require('sequelize');

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    let currentPeriod, previousPeriod;

    if (period === 'week') {
      // Current week
      const dayOfWeek = now.getDay();
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous week
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(previousStart);
      previousEnd.setDate(previousStart.getDate() + 6);
      previousEnd.setHours(23, 59, 59, 999);

      currentPeriod = `Week ${Math.ceil((now.getDate() + (7 - dayOfWeek)) / 7)}`;
      previousPeriod = `Week ${Math.ceil((previousStart.getDate() + (7 - previousStart.getDay())) / 7)}`;
    } else {
      // Current month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Previous month
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      previousPeriod = `${previousStart.getFullYear()}-${String(previousStart.getMonth() + 1).padStart(2, '0')}`;
    }

    // Current period data
    const currentEntries = await StockEntry.findAll({
      where: {
        warehouseId: id,
        createdAt: {
          [Op.between]: [currentStart, currentEnd]
        }
      },
      attributes: ['type', 'quantity']
    });

    const currentTotalIn = currentEntries
      .filter(e => e.type === 'IN')
      .reduce((sum, e) => sum + e.quantity, 0);
    const currentTotalOut = currentEntries
      .filter(e => e.type === 'OUT')
      .reduce((sum, e) => sum + e.quantity, 0);

    // Previous period data
    const previousEntries = await StockEntry.findAll({
      where: {
        warehouseId: id,
        createdAt: {
          [Op.between]: [previousStart, previousEnd]
        }
      },
      attributes: ['type', 'quantity']
    });

    const previousTotalIn = previousEntries
      .filter(e => e.type === 'IN')
      .reduce((sum, e) => sum + e.quantity, 0);
    const previousTotalOut = previousEntries
      .filter(e => e.type === 'OUT')
      .reduce((sum, e) => sum + e.quantity, 0);

    // Calculate percentage change
    const inChange = previousTotalIn > 0
      ? (((currentTotalIn - previousTotalIn) / previousTotalIn) * 100).toFixed(1)
      : currentTotalIn > 0 ? '100.0' : '0.0';
    
    const outChange = previousTotalOut > 0
      ? (((currentTotalOut - previousTotalOut) / previousTotalOut) * 100).toFixed(1)
      : currentTotalOut > 0 ? '100.0' : '0.0';
    
    const entriesChange = previousEntries.length > 0
      ? (((currentEntries.length - previousEntries.length) / previousEntries.length) * 100).toFixed(1)
      : currentEntries.length > 0 ? '100.0' : '0.0';

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      current: {
        period: currentPeriod,
        totalIn: currentTotalIn,
        totalOut: currentTotalOut,
        entries: currentEntries.length
      },
      previous: {
        period: previousPeriod,
        totalIn: previousTotalIn,
        totalOut: previousTotalOut,
        entries: previousEntries.length
      },
      change: {
        in: parseFloat(inChange),
        out: parseFloat(outChange),
        entries: parseFloat(entriesChange)
      }
    });
  } catch (error) {
    console.error('Get warehouse comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get camera status history (optional)
 * Query params: days (default: 7)
 */
const getWarehouseCameraStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const cameras = await Camera.findAll({
      where: { warehouseId: id },
      attributes: ['id', 'name', 'status', 'updatedAt']
    });

    // For now, return current status
    // In production, you might want to track status changes over time
    const statusHistory = cameras.map(camera => ({
      cameraId: camera.id,
      cameraName: camera.name,
      currentStatus: camera.status,
      lastUpdated: camera.updatedAt
    }));

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      cameras: statusHistory,
      summary: {
        total: cameras.length,
        online: cameras.filter(c => c.status === 'online').length,
        offline: cameras.filter(c => c.status === 'offline').length
      }
    });
  } catch (error) {
    console.error('Get warehouse camera status history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get inspector activity (optional)
 */
const getWarehouseInspectorActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { Op } = require('sequelize');

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Get assigned inspectors
    const assignments = await InspectorWarehouse.findAll({
      where: { warehouseId: id },
      include: [
        {
          model: User,
          as: 'inspector',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Get activity for each inspector
    const inspectorActivity = await Promise.all(
      assignments.map(async (assignment) => {
        const inspector = assignment.inspector;
        
        // Count entries by this inspector
        const totalEntries = await StockEntry.count({
          where: {
            warehouseId: id,
            inspectorId: inspector.id
          }
        });

        // Get last entry
        const lastEntry = await StockEntry.findOne({
          where: {
            warehouseId: id,
            inspectorId: inspector.id
          },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt']
        });

        // Get entries this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const entriesThisMonth = await StockEntry.count({
          where: {
            warehouseId: id,
            inspectorId: inspector.id,
            createdAt: { [Op.gte]: startOfMonth }
          }
        });

        return {
          inspector: {
            id: inspector.id,
            name: inspector.name,
            email: inspector.email
          },
          activity: {
            totalEntries,
            entriesThisMonth,
            lastActivity: lastEntry ? lastEntry.createdAt : null
          }
        };
      })
    );

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name
      },
      inspectorActivity
    });
  } catch (error) {
    console.error('Get warehouse inspector activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseCameras,
  getWarehouseStats,
  getWarehouseRecentEntries,
  getWarehouseInventory,
  getWarehouseStockTrends,
  getWarehouseTopItems,
  getWarehouseActivityTimeline,
  getWarehouseStockDistribution,
  getWarehouseComparison,
  getWarehouseCameraStatusHistory,
  getWarehouseInspectorActivity
};
