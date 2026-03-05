const { StockEntry, Warehouse, User, InspectorWarehouse } = require('../models');
const { Op } = require('sequelize');

const getStockReports = async (req, res) => {
  try {
    const { warehouseId, startDate, endDate, type } = req.query;
    const user = req.user;

    let whereClause = {};
    let warehouseFilter = {};

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    // Type filter
    if (type && ['IN', 'OUT'].includes(type)) {
      whereClause.type = type;
    }

    // Warehouse filter
    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    // If inspector, only show assigned warehouses
    // super_admin and permanent_secretary can view all warehouses
    if (user.role === 'inspector') {
      const assignments = await InspectorWarehouse.findAll({
        where: { userId: user.id },
        attributes: ['warehouseId']
      });
      const warehouseIds = assignments.map(a => a.warehouseId);
      
      if (warehouseId && !warehouseIds.includes(warehouseId)) {
        return res.status(403).json({ error: 'Access denied to this warehouse' });
      }
      
      whereClause.warehouseId = warehouseId 
        ? warehouseId 
        : { [Op.in]: warehouseIds };
    }

    const stockEntries = await StockEntry.findAll({
      where: whereClause,
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

    // Calculate summary
    const totalIn = stockEntries
      .filter(e => e.type === 'IN')
      .reduce((sum, e) => sum + e.quantity, 0);
    
    const totalOut = stockEntries
      .filter(e => e.type === 'OUT')
      .reduce((sum, e) => sum + e.quantity, 0);

    res.json({
      stockEntries,
      summary: {
        totalEntries: stockEntries.length,
        totalIn,
        totalOut,
        netStock: totalIn - totalOut
      },
      filters: {
        warehouseId: warehouseId || 'all',
        startDate: startDate || null,
        endDate: endDate || null,
        type: type || 'all'
      }
    });
  } catch (error) {
    console.error('Get stock reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getWarehouseAnalytics = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { startDate, endDate } = req.query;
    const user = req.user;

    // Check warehouse access
    // super_admin and permanent_secretary can view all warehouses
    if (user.role === 'inspector') {
      const assignment = await InspectorWarehouse.findOne({
        where: { userId: user.id, warehouseId }
      });
      if (!assignment) {
        return res.status(403).json({ error: 'Access denied to this warehouse' });
      }
    }

    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    let whereClause = { warehouseId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const stockEntries = await StockEntry.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'inspector',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by date for chart data
    const entriesByDate = {};
    stockEntries.forEach(entry => {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!entriesByDate[date]) {
        entriesByDate[date] = { in: 0, out: 0, count: 0 };
      }
      if (entry.type === 'IN') {
        entriesByDate[date].in += entry.quantity;
      } else {
        entriesByDate[date].out += entry.quantity;
      }
      entriesByDate[date].count++;
    });

    const chartData = Object.keys(entriesByDate)
      .sort()
      .map(date => ({
        date,
        in: entriesByDate[date].in,
        out: entriesByDate[date].out,
        count: entriesByDate[date].count
      }));

    // Group by item name
    const itemsSummary = {};
    stockEntries.forEach(entry => {
      if (!itemsSummary[entry.itemName]) {
        itemsSummary[entry.itemName] = { in: 0, out: 0 };
      }
      if (entry.type === 'IN') {
        itemsSummary[entry.itemName].in += entry.quantity;
      } else {
        itemsSummary[entry.itemName].out += entry.quantity;
      }
    });

    const itemsData = Object.keys(itemsSummary).map(itemName => ({
      itemName,
      totalIn: itemsSummary[itemName].in,
      totalOut: itemsSummary[itemName].out,
      netStock: itemsSummary[itemName].in - itemsSummary[itemName].out
    }));

    res.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
        status: warehouse.status
      },
      totalEntries: stockEntries.length,
      chartData,
      itemsSummary: itemsData,
      summary: {
        totalIn: stockEntries.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0),
        totalOut: stockEntries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0)
      }
    });
  } catch (error) {
    console.error('Get warehouse analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStockReports,
  getWarehouseAnalytics
};
