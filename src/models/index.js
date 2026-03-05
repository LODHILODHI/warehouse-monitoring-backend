const User = require('./user.model');
const Warehouse = require('./warehouse.model');
const InspectorWarehouse = require('./inspectorWarehouse.model');
const Camera = require('./camera.model');
const StockEntry = require('./stockEntry.model');

// Define associations

// User associations
User.hasMany(InspectorWarehouse, { foreignKey: 'userId', as: 'assignedWarehouses' });
User.hasMany(StockEntry, { foreignKey: 'inspectorId', as: 'stockEntries' });

// Warehouse associations
Warehouse.hasMany(InspectorWarehouse, { foreignKey: 'warehouseId', as: 'inspectors' });
Warehouse.hasMany(Camera, { foreignKey: 'warehouseId', as: 'cameras' });
Warehouse.hasMany(StockEntry, { foreignKey: 'warehouseId', as: 'stockEntries' });

// InspectorWarehouse associations
InspectorWarehouse.belongsTo(User, { foreignKey: 'userId', as: 'inspector' });
InspectorWarehouse.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// Camera associations
Camera.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// StockEntry associations
StockEntry.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
StockEntry.belongsTo(User, { foreignKey: 'inspectorId', as: 'inspector' });

module.exports = {
  User,
  Warehouse,
  InspectorWarehouse,
  Camera,
  StockEntry
};
