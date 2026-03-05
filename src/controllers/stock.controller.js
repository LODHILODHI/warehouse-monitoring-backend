const { StockEntry, Warehouse, User, InspectorWarehouse } = require('../models');

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

    await stockEntry.destroy();

    res.json({
      message: 'Stock entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete stock entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createStockEntry,
  getStockEntries,
  updateStockEntry,
  deleteStockEntry
};
