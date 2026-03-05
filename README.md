# Warehouse Monitoring System - Backend API

A Node.js/Express backend API for warehouse monitoring with role-based access control.

## Tech Stack

- Node.js
- Express.js
- MySQL
- Sequelize (class-based models)
- JWT Authentication
- bcrypt (password hashing)

## Project Structure

```
warehouse-monitoring/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── warehouse.model.js
│   │   ├── camera.model.js
│   │   ├── inspectorWarehouse.model.js
│   │   ├── stockEntry.model.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── warehouse.controller.js
│   │   └── stock.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── warehouse.routes.js
│   │   └── stock.routes.js
│   └── app.js
├── server.js
├── .env
└── package.json
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (if available) or create a `.env` file
   - Update the following variables:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=warehouse_monitoring
     DB_USER=root
     DB_PASSWORD=your_password
     JWT_SECRET=your-super-secret-jwt-key
     PORT=3000
     NODE_ENV=development
     ```

3. **Create MySQL Database**
   ```sql
   CREATE DATABASE warehouse_monitoring;
   ```

4. **Run the Server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Database Sync**
   - The server will automatically sync database models on startup
   - For production, use Sequelize migrations instead

6. **Seed Initial Data (Optional)**
   ```bash
   npm run seed
   ```
   This creates default users and warehouses for testing. See `SEEDERS_README.md` for details.

## CORS Configuration

The backend is configured with CORS support for frontend integration.

### Development
- Automatically allows requests from common localhost ports (5173, 5174, 3000, etc.)
- No additional configuration needed

### Production
Set `ALLOWED_ORIGINS` in your `.env` file:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

For detailed CORS configuration, see `CORS_CONFIG.md`.

## API Endpoints

### Authentication

#### POST /api/login
Login and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "inspector"
  }
}
```

### Warehouses

#### POST /api/warehouses
Create a new warehouse (Super Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Warehouse A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, City, State",
  "status": "active"
}
```

#### GET /api/warehouses
Get all warehouses (Authenticated users).

**Headers:**
```
Authorization: Bearer <token>
```

### Stock Entries

#### POST /api/stock
Create a stock entry (Inspector only, must be assigned to warehouse).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "warehouseId": "uuid",
  "type": "IN",
  "itemName": "Product Name",
  "quantity": 100,
  "notes": "Optional notes"
}
```

#### GET /api/stock/:warehouseId
Get stock entries for a warehouse (Authenticated users with warehouse access).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "warehouse": {
    "id": "uuid",
    "name": "Warehouse A"
  },
  "stockEntries": [...]
}
```

## Models

### User
- `id` (UUID)
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (ENUM: 'super_admin', 'inspector')

### Warehouse
- `id` (UUID)
- `name` (String)
- `latitude` (Decimal)
- `longitude` (Decimal)
- `address` (Text)
- `status` (ENUM: 'active', 'inactive')

### InspectorWarehouse
- `id` (UUID)
- `userId` (UUID, FK → User)
- `warehouseId` (UUID, FK → Warehouse)

### Camera
- `id` (UUID)
- `warehouseId` (UUID, FK → Warehouse)
- `name` (String)
- `streamUrl` (String)
- `status` (ENUM: 'online', 'offline')

### StockEntry
- `id` (UUID)
- `warehouseId` (UUID, FK → Warehouse)
- `inspectorId` (UUID, FK → User)
- `type` (ENUM: 'IN', 'OUT')
- `itemName` (String)
- `quantity` (Integer)
- `notes` (Text, optional)

## Role-Based Access Control

- **Super Admin**: Can create warehouses and access all warehouses
- **Inspector**: Can only create stock entries and view stock for assigned warehouses

## Security Features

- JWT-based authentication
- bcrypt password hashing (automatic on create/update)
- Role-based middleware protection
- Warehouse access validation for inspectors
