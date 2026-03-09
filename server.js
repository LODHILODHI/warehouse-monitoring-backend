require('dotenv').config();
const { DataTypes } = require('sequelize');
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { User, Warehouse, InspectorWarehouse, Camera, StockEntry } = require('./src/models');

const PORT = process.env.PORT || 3000;

// Add missing columns to existing tables (e.g. capacity on warehouses)
const runPendingSchemaUpdates = async () => {
  const qi = sequelize.getQueryInterface();
  try {
    const tableDesc = await qi.describeTable('warehouses');
    if (!tableDesc.capacity) {
      await qi.addColumn('warehouses', 'capacity', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
      console.log('Added "capacity" column to warehouses table.');
    }
  } catch (e) {
    if (e.message && e.message.includes("Unknown column")) return;
    console.warn('Schema update check skipped or failed:', e.message);
  }
};

// Sync database models
const syncDatabase = async () => {
  try {
    await runPendingSchemaUpdates();
    // Use { alter: true } for development, { force: true } to drop and recreate tables
    // In production, use migrations instead
    await sequelize.sync({ alter: false });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await syncDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
