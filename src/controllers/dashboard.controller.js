const { Warehouse, StockEntry, Camera, User, InspectorWarehouse } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper function to calculate trend
const calculateTrend = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? { change: 100.0, changeType: 'increase' } : { change: 0.0, changeType: 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    change: Math.round(change * 10) / 10, // Round to 1 decimal
    changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  };
};

// Helper function to get month abbreviation
const getMonthAbbr = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, warehouseId, inspectorId } = req.query; // Pagination and filters for recent entries
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    const now = new Date();
    
    // Date calculations
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    // 30 days ago for warehouse trend
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let warehouseFilter = {};
    let warehouseIds = [];
    
    // Handle warehouseId filter from query parameter
    if (warehouseId) {
      // Verify warehouse exists and user has access
      if (user.role === 'inspector') {
        // For inspector, verify they are assigned to this warehouse
        const assignment = await InspectorWarehouse.findOne({
          where: {
            userId: user.id,
            warehouseId: warehouseId
          }
        });
        if (!assignment) {
          return res.status(403).json({ 
            error: 'Access denied. You are not assigned to this warehouse.' 
          });
        }
      }
      warehouseIds = [warehouseId];
      warehouseFilter = { id: warehouseId };
    } else {
      // If inspector, only count assigned warehouses
      if (user.role === 'inspector') {
        const assignments = await InspectorWarehouse.findAll({
          where: { userId: user.id },
          attributes: ['warehouseId']
        });
        warehouseIds = assignments.map(a => a.warehouseId);
        warehouseFilter = { id: { [Op.in]: warehouseIds } };
      } else {
        // For super_admin and permanent_secretary, get all warehouse IDs
        const allWarehouses = await Warehouse.findAll({
          attributes: ['id']
        });
        warehouseIds = allWarehouses.map(w => w.id);
      }
    }
    
    // Handle inspectorId filter from query parameter
    let inspectorFilter = {};
    if (inspectorId) {
      // Verify inspector exists
      const inspector = await User.findByPk(inspectorId);
      if (!inspector || inspector.role !== 'inspector') {
        return res.status(400).json({ error: 'Invalid inspector ID' });
      }
      
      // For inspector role, they can only filter by themselves
      if (user.role === 'inspector' && inspectorId !== user.id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only filter by your own entries.' 
        });
      }
      inspectorFilter = { inspectorId: inspectorId };
    }

    // ========== METRICS ==========
    
    // Total Warehouses
    const totalWarehouses = await Warehouse.count({ where: warehouseFilter });
    const activeWarehouses = await Warehouse.count({ 
      where: { ...warehouseFilter, status: 'active' } 
    });
    const inactiveWarehouses = totalWarehouses - activeWarehouses;
    
    // Total Warehouses 30 days ago (for trend)
    const totalWarehouses30DaysAgo = await Warehouse.count({
      where: {
        ...warehouseFilter,
        createdAt: { [Op.lte]: thirtyDaysAgo }
      }
    });

    // Stock Entries Today
    const stockEntriesToday = await StockEntry.count({
      where: {
        createdAt: { [Op.between]: [startOfToday, endOfToday] },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Stock Entries Yesterday
    const stockEntriesYesterday = await StockEntry.count({
      where: {
        createdAt: { [Op.between]: [startOfYesterday, endOfYesterday] },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Stock Entries This Week
    const stockEntriesThisWeek = await StockEntry.count({
      where: {
        createdAt: { [Op.gte]: startOfWeek },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Stock Entries Last Week
    const stockEntriesLastWeek = await StockEntry.count({
      where: {
        createdAt: { 
          [Op.between]: [startOfLastWeek, new Date(startOfWeek.getTime() - 1)]
        },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Stock Entries This Month
    const stockEntriesThisMonth = await StockEntry.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Stock Entries Last Month
    const stockEntriesLastMonth = await StockEntry.count({
      where: {
        createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
        ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
      }
    });

    // Active Warehouses Last Month (for trend)
    const activeWarehousesLastMonth = await Warehouse.count({
      where: {
        ...warehouseFilter,
        status: 'active',
        createdAt: { [Op.lte]: endOfLastMonth }
      }
    });

    // Total Cameras
    const totalCameras = await Camera.count({
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          where: warehouseFilter,
          required: true
        }
      ]
    });

    const onlineCameras = await Camera.count({
      where: { status: 'online' },
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          where: warehouseFilter,
          required: true
        }
      ]
    });

    const offlineCameras = totalCameras - onlineCameras;

    // Total Inspectors
    const totalInspectors = await User.count({
      where: { role: 'inspector' }
    });

    // Active Inspectors (inspectors with at least one assignment in accessible warehouses)
    let activeInspectors;
    if (warehouseIds.length > 0) {
      const activeInspectorResult = await sequelize.query(`
        SELECT DISTINCT userId 
        FROM inspector_warehouses 
        WHERE warehouseId IN (${warehouseIds.map(() => '?').join(',')})
      `, {
        replacements: warehouseIds,
        type: sequelize.QueryTypes.SELECT
      });
      const inspectorUserIds = activeInspectorResult.map(r => r.userId);
      activeInspectors = inspectorUserIds.length > 0 ? await User.count({
        where: {
          id: { [Op.in]: inspectorUserIds },
          role: 'inspector'
        }
      }) : 0;
    } else {
      activeInspectors = totalInspectors; // All inspectors are active if user can see all warehouses
    }

    // Total Stock Items (unique item names across all accessible warehouses)
    const totalStockItemsResult = await StockEntry.findAll({
      where: warehouseIds.length > 0 ? { warehouseId: { [Op.in]: warehouseIds } } : {},
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('itemName')), 'itemName']
      ],
      raw: true
    });
    const totalStockItems = totalStockItemsResult.length;

    // Low Stock Items (items with net stock < 10)
    const allEntries = await StockEntry.findAll({
      where: warehouseIds.length > 0 ? { warehouseId: { [Op.in]: warehouseIds } } : {},
      attributes: ['itemName', 'type', 'quantity', 'warehouseId'],
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name']
        }
      ]
    });

    // Calculate net stock per item per warehouse
    const inventoryMap = {};
    allEntries.forEach(entry => {
      const key = `${entry.warehouseId}_${entry.itemName}`;
      if (!inventoryMap[key]) {
        inventoryMap[key] = {
          itemName: entry.itemName,
          warehouseId: entry.warehouseId,
          warehouseName: entry.warehouse?.name || 'Unknown',
          totalIn: 0,
          totalOut: 0,
          netStock: 0
        };
      }
      
      if (entry.type === 'IN') {
        inventoryMap[key].totalIn += entry.quantity;
      } else {
        inventoryMap[key].totalOut += entry.quantity;
      }
    });

    // Calculate net stock
    Object.values(inventoryMap).forEach(item => {
      item.netStock = item.totalIn - item.totalOut;
    });

    // Find low stock items (netStock < 10)
    const lowStockItemsList = Object.values(inventoryMap).filter(item => item.netStock < 10);
    const lowStockItems = lowStockItemsList.length;

    // Critical low stock alerts (netStock < 0 or netStock < 5)
    const lowStockAlerts = lowStockItemsList
      .filter(item => item.netStock < 0 || item.netStock < 5)
      .map(item => ({
        itemName: item.itemName,
        warehouseName: item.warehouseName,
        netStock: item.netStock,
        alertLevel: item.netStock < 0 ? 'critical' : 'warning'
      }))
      .sort((a, b) => a.netStock - b.netStock) // Sort by lowest stock first
      .slice(0, 10); // Top 10 most critical

    // ========== TRENDS ==========
    
    const trends = {
      warehouses: {
        current: totalWarehouses,
        previous: totalWarehouses30DaysAgo,
        ...calculateTrend(totalWarehouses, totalWarehouses30DaysAgo)
      },
      stockEntriesToday: {
        current: stockEntriesToday,
        previous: stockEntriesYesterday,
        ...calculateTrend(stockEntriesToday, stockEntriesYesterday)
      },
      stockEntriesThisMonth: {
        current: stockEntriesThisMonth,
        previous: stockEntriesLastMonth,
        ...calculateTrend(stockEntriesThisMonth, stockEntriesLastMonth)
      },
      activeWarehouses: {
        current: activeWarehouses,
        previous: activeWarehousesLastMonth,
        ...calculateTrend(activeWarehouses, activeWarehousesLastMonth)
      }
    };

    // ========== CHART DATA (Last 6 Months) ==========
    
    const chartData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthEntries = await StockEntry.findAll({
        where: {
          createdAt: { [Op.between]: [monthDate, new Date(nextMonthDate.getTime() - 1)] },
          ...(warehouseIds.length > 0 && { warehouseId: { [Op.in]: warehouseIds } })
        },
        attributes: ['type', 'quantity']
      });

      const entries = monthEntries.length;
      const inQuantity = monthEntries.filter(e => e.type === 'IN').reduce((sum, e) => sum + e.quantity, 0);
      const outQuantity = monthEntries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + e.quantity, 0);

      chartData.push({
        month: monthNames[monthDate.getMonth()],
        entries: entries,
        in: inQuantity, // Total quantity IN
        out: outQuantity // Total quantity OUT
      });
    }

    // ========== RECENT STOCK ENTRIES ==========
    
    // Build where clause for recent entries with filters
    const recentEntriesWhere = {};
    
    // Apply warehouse filter
    if (warehouseIds.length > 0) {
      recentEntriesWhere.warehouseId = { [Op.in]: warehouseIds };
    }
    
    // Apply inspector filter
    if (inspectorFilter.inspectorId) {
      recentEntriesWhere.inspectorId = inspectorFilter.inspectorId;
    }
    
    // Get total count for pagination
    const totalRecentEntries = await StockEntry.count({
      where: recentEntriesWhere
    });
    
    const recentStockEntries = await StockEntry.findAll({
      limit: limitNum,
      offset: offset,
      where: recentEntriesWhere,
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'inspector',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format recent entries
    const formattedRecentEntries = recentStockEntries.map(entry => ({
      id: entry.id,
      itemName: entry.itemName,
      type: entry.type,
      quantity: entry.quantity,
      notes: entry.notes,
      warehouse: {
        id: entry.warehouse?.id,
        name: entry.warehouse?.name
      },
      inspector: {
        id: entry.inspector?.id,
        name: entry.inspector?.name,
        email: entry.inspector?.email
      },
      createdAt: entry.createdAt
    }));
    
    const totalPages = Math.ceil(totalRecentEntries / limitNum);

    // ========== TOP WAREHOUSES ==========
    
    let warehouseStats;
    if (warehouseIds.length > 0) {
      warehouseStats = await sequelize.query(`
        SELECT 
          w.id as warehouseId,
          w.name as warehouseName,
          COUNT(se.id) as totalEntries,
          SUM(CASE WHEN se.createdAt >= ? THEN 1 ELSE 0 END) as entriesThisMonth,
          SUM(CASE WHEN se.type = 'IN' THEN se.quantity ELSE 0 END) - 
          SUM(CASE WHEN se.type = 'OUT' THEN se.quantity ELSE 0 END) as totalStock
        FROM warehouses w
        LEFT JOIN stock_entries se ON w.id = se.warehouseId
        WHERE w.id IN (${warehouseIds.map(() => '?').join(',')})
        GROUP BY w.id, w.name
        ORDER BY totalEntries DESC
        LIMIT 5
      `, {
        replacements: [startOfMonth, ...warehouseIds],
        type: sequelize.QueryTypes.SELECT
      });
    } else {
      warehouseStats = await sequelize.query(`
        SELECT 
          w.id as warehouseId,
          w.name as warehouseName,
          COUNT(se.id) as totalEntries,
          SUM(CASE WHEN se.createdAt >= ? THEN 1 ELSE 0 END) as entriesThisMonth,
          SUM(CASE WHEN se.type = 'IN' THEN se.quantity ELSE 0 END) - 
          SUM(CASE WHEN se.type = 'OUT' THEN se.quantity ELSE 0 END) as totalStock
        FROM warehouses w
        LEFT JOIN stock_entries se ON w.id = se.warehouseId
        GROUP BY w.id, w.name
        ORDER BY totalEntries DESC
        LIMIT 5
      `, {
        replacements: [startOfMonth],
        type: sequelize.QueryTypes.SELECT
      });
    }

    const topWarehouses = warehouseStats.map(stat => ({
      warehouseId: stat.warehouseId,
      warehouseName: stat.warehouseName,
      totalEntries: parseInt(stat.totalEntries) || 0,
      entriesThisMonth: parseInt(stat.entriesThisMonth) || 0,
      totalStock: parseInt(stat.totalStock) || 0
    }));

    // ========== STOCK DISTRIBUTION ==========
    
    const allStockEntries = await StockEntry.findAll({
      where: warehouseIds.length > 0 ? { warehouseId: { [Op.in]: warehouseIds } } : {},
      attributes: ['type', 'quantity']
    });

    const totalIn = allStockEntries
      .filter(e => e.type === 'IN')
      .reduce((sum, e) => sum + e.quantity, 0);
    
    const totalOut = allStockEntries
      .filter(e => e.type === 'OUT')
      .reduce((sum, e) => sum + e.quantity, 0);
    
    const netStock = totalIn - totalOut;
    const total = totalIn + totalOut;
    
    const stockDistribution = {
      totalIn: totalIn,
      totalOut: totalOut,
      netStock: netStock,
      inPercentage: total > 0 ? Math.round((totalIn / total) * 100 * 10) / 10 : 0,
      outPercentage: total > 0 ? Math.round((totalOut / total) * 100 * 10) / 10 : 0
    };

    // ========== RESPONSE ==========
    
    res.json({
      metrics: {
        totalWarehouses,
        activeWarehouses,
        inactiveWarehouses,
        stockEntriesToday,
        stockEntriesThisWeek,
        stockEntriesThisMonth,
        totalCameras,
        onlineCameras,
        offlineCameras,
        totalInspectors,
        activeInspectors,
        totalStockItems,
        lowStockItems
      },
      trends,
      chartData,
      recentStockEntries: {
        items: formattedRecentEntries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages,
          totalItems: totalRecentEntries,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filters: {
          warehouseId: warehouseId || null,
          inspectorId: inspectorId || null
        }
      },
      topWarehouses,
      stockDistribution,
      lowStockAlerts
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};
