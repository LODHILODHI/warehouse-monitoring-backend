require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { User, Warehouse, InspectorWarehouse, Camera, StockEntry } = require('./src/models');

const PORT = process.env.PORT || 3000;

// Sync database models
const syncDatabase = async () => {
  try {
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
