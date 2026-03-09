const User = require('./user.model');
const Warehouse = require('./warehouse.model');
const InspectorWarehouse = require('./inspectorWarehouse.model');
const Camera = require('./camera.model');
const StockEntry = require('./stockEntry.model');
const AuditLog = require('./auditLog.model');
const LoginLog = require('./loginLog.model');
const SystemSetting = require('./systemSetting.model');

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

// AuditLog & LoginLog
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' });

module.exports = {
  User,
  Warehouse,
  InspectorWarehouse,
  Camera,
  StockEntry,
  AuditLog,
  LoginLog,
  SystemSetting
};
