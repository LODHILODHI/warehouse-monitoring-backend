const { StockEntry, Warehouse, User, InspectorWarehouse } = require('../models');
const { logAudit } = require('../utils/auditHelper');

const createStockEntry = async (req, res) => {
  try {
    const { warehouseId, type, itemName, quantity, notes } = req.body;

    if (!warehouseId || !type || !itemName || !quantity) {
      return res.status(400).json({ 
        error: 'Warehouse ID, type, item name, and quantity are required' 
      });
    }

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either IN or OUT' });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // For inspectors, verify they are assigned to this warehouse
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
    }

    const stockEntry = await StockEntry.create({
      warehouseId,
      inspectorId: req.user.id,
      type,
      itemName,
      quantity,
      notes: notes || null
    });

    await logAudit(req, 'stock_entry_created', 'stock_entry', stockEntry.id, { warehouseId, type, itemName, quantity });

    res.status(201).json({
      message: 'Stock entry created successfully',
      stockEntry
    });
  } catch (error) {
    console.error('Create stock entry error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStockEntries = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    if (!warehouseId) {
      return res.status(400).json({ error: 'Warehouse ID is required' });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const stockEntries = await StockEntry.findAll({
      where: { warehouseId },
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
      stockEntries 
    });
  } catch (error) {
    console.error('Get stock entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, itemName, quantity, notes } = req.body;

    const stockEntry = await StockEntry.findByPk(id);
    if (!stockEntry) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    // Check if user has permission (inspector can only update their own entries, super_admin can update any)
    if (req.user.role === 'inspector' && stockEntry.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own stock entries' });
    }

    // Update only provided fields
    if (type !== undefined) {
      if (!['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either IN or OUT' });
      }
      stockEntry.type = type;
    }
    if (itemName !== undefined) stockEntry.itemName = itemName;
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }
      stockEntry.quantity = quantity;
    }
    if (notes !== undefined) stockEntry.notes = notes;

    await stockEntry.save();

    await logAudit(req, 'stock_entry_updated', 'stock_entry', stockEntry.id, { type: stockEntry.type, itemName: stockEntry.itemName, quantity: stockEntry.quantity });

    res.json({
      message: 'Stock entry updated successfully',
      stockEntry
    });
  } catch (error) {
    console.error('Update stock entry error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteStockEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const stockEntry = await StockEntry.findByPk(id);
    if (!stockEntry) {
      return res.status(404).json({ error: 'Stock entry not found' });
    }

    // Check if user has permission (inspector can only delete their own entries, super_admin can delete any)
    if (req.user.role === 'inspector' && stockEntry.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own stock entries' });
    }

    const entryId = stockEntry.id;
    const details = { warehouseId: stockEntry.warehouseId, itemName: stockEntry.itemName, quantity: stockEntry.quantity };
    await stockEntry.destroy();

    await logAudit(req, 'stock_entry_deleted', 'stock_entry', entryId, details);

    res.json({
      message: 'Stock entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete stock entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Transfer stock between warehouses: creates OUT at source, IN at destination.
 * POST body: { fromWarehouseId, toWarehouseId, itemName, quantity, notes? }
 */
const transferStock = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, itemName, quantity, notes } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !itemName || !quantity) {
      return res.status(400).json({
        error: 'fromWarehouseId, toWarehouseId, itemName, and quantity are required'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouse must be different' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const fromWarehouse = await Warehouse.findByPk(fromWarehouseId);
    const toWarehouse = await Warehouse.findByPk(toWarehouseId);

    if (!fromWarehouse) {
      return res.status(404).json({ error: 'Source warehouse not found' });
    }
    if (!toWarehouse) {
      return res.status(404).json({ error: 'Destination warehouse not found' });
    }

    if (req.user.role === 'inspector') {
      const fromAssign = await InspectorWarehouse.findOne({
        where: { userId: req.user.id, warehouseId: fromWarehouseId }
      });
      const toAssign = await InspectorWarehouse.findOne({
        where: { userId: req.user.id, warehouseId: toWarehouseId }
      });
      if (!fromAssign || !toAssign) {
        return res.status(403).json({
          error: 'Inspector must be assigned to both source and destination warehouses to transfer'
        });
      }
    }

    const transferNote = notes
      ? `${notes} (Transferred to ${toWarehouse.name})`
      : `Transferred to ${toWarehouse.name}`;
    const inNote = notes
      ? `${notes} (Transferred from ${fromWarehouse.name})`
      : `Transferred from ${fromWarehouse.name}`;

    const outEntry = await StockEntry.create({
      warehouseId: fromWarehouseId,
      inspectorId: req.user.id,
      type: 'OUT',
      itemName,
      quantity,
      notes: transferNote
    });

    const inEntry = await StockEntry.create({
      warehouseId: toWarehouseId,
      inspectorId: req.user.id,
      type: 'IN',
      itemName,
      quantity,
      notes: inNote
    });

    await logAudit(req, 'stock_transferred', 'stock_entry', null, {
      fromWarehouseId,
      toWarehouseId,
      itemName,
      quantity,
      outEntryId: outEntry.id,
      inEntryId: inEntry.id
    });

    res.status(201).json({
      message: 'Stock transfer completed successfully',
      transfer: {
        out: outEntry,
        in: inEntry
      }
    });
  } catch (error) {
    console.error('Transfer stock error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createStockEntry,
  getStockEntries,
  updateStockEntry,
  deleteStockEntry,
  transferStock
};
