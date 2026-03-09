const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const stockRoutes = require('./routes/stock.routes');
const cameraRoutes = require('./routes/camera.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes = require('./routes/reports.routes');
const userRoutes = require('./routes/user.routes');
const mapRoutes = require('./routes/map.routes');
const inspectorRoutes = require('./routes/inspector.routes');
const securityRoutes = require('./routes/security.routes');
const auditRoutes = require('./routes/audit.routes');
const adminRoutes = require('./routes/admin.routes');
const { maintenanceCheck } = require('./middleware/maintenance.middleware');
const { getPublicSettings } = require('./controllers/admin.controller');

const app = express();

// CORS Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  // In development, allow all origins for easier testing
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
  }));
  console.log('CORS: Allowing all origins (development mode)');
} else {
  // In production, use strict CORS
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
      
      if (allowedOrigins.length === 0) {
        console.warn('WARNING: ALLOWED_ORIGINS not set in production!');
        return callback(new Error('CORS: ALLOWED_ORIGINS must be configured in production'));
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
  };
  
  app.use(cors(corsOptions));
  console.log('CORS: Using strict origin policy (production mode)');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Maintenance mode (must be before routes; allows /api/login, /api/admin, /api/settings/public)
app.use('/api', maintenanceCheck);

// Public settings (no auth) - system name, maintenance message, feature flags
app.get('/api/settings/public', getPublicSettings);

// Routes
app.use('/api', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/inspector', inspectorRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Warehouse Monitoring API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection test
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = app;
