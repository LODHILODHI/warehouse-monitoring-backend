# Quick API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints Summary

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/login` | ❌ | - | Login and get token |
| POST | `/warehouses` | ✅ | `super_admin` | Create warehouse |
| GET | `/warehouses` | ✅ | - | Get all warehouses |
| POST | `/stock` | ✅ | `inspector` | Create stock entry |
| GET | `/stock/:warehouseId` | ✅ | - | Get stock entries |

---

## Request/Response Examples

### 1. Login
```javascript
// Request
POST /api/login
{
  "email": "inspector@example.com",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "inspector@example.com",
    "role": "inspector"
  }
}
```

### 2. Get Warehouses
```javascript
// Request
GET /api/warehouses
Headers: { Authorization: "Bearer <token>" }

// Response
{
  "warehouses": [
    {
      "id": "uuid",
      "name": "Warehouse A",
      "latitude": "40.7128",
      "longitude": "-74.0060",
      "address": "123 Main St",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Create Warehouse (Super Admin)
```javascript
// Request
POST /api/warehouses
Headers: { Authorization: "Bearer <token>" }
{
  "name": "Warehouse B",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "address": "456 Broadway, NY",
  "status": "active"
}

// Response (201)
{
  "message": "Warehouse created successfully",
  "warehouse": { ... }
}
```

### 4. Create Stock Entry (Inspector)
```javascript
// Request
POST /api/stock
Headers: { Authorization: "Bearer <token>" }
{
  "warehouseId": "uuid",
  "type": "IN",
  "itemName": "Product XYZ",
  "quantity": 50,
  "notes": "Received shipment"
}

// Response (201)
{
  "message": "Stock entry created successfully",
  "stockEntry": { ... }
}
```

### 5. Get Stock Entries
```javascript
// Request
GET /api/stock/:warehouseId
Headers: { Authorization: "Bearer <token>" }

// Response
{
  "warehouse": {
    "id": "uuid",
    "name": "Warehouse A"
  },
  "stockEntries": [
    {
      "id": "uuid",
      "warehouseId": "uuid",
      "inspectorId": "uuid",
      "type": "IN",
      "itemName": "Product XYZ",
      "quantity": 50,
      "notes": "Received shipment",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "inspector": {
        "id": "uuid",
        "name": "John Doe",
        "email": "inspector@example.com"
      }
    }
  ]
}
```

---

## Error Responses

```javascript
// 400 Bad Request
{
  "error": "Warehouse ID, type, item name, and quantity are required"
}

// 401 Unauthorized
{
  "error": "Authentication required"
}

// 403 Forbidden
{
  "error": "Access denied. Inspector role required."
}

// 404 Not Found
{
  "error": "Warehouse not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## Data Types

### User Role
- `"super_admin"` - Full access
- `"inspector"` - Limited to assigned warehouses

### Warehouse Status
- `"active"` - Warehouse is operational
- `"inactive"` - Warehouse is not operational

### Stock Entry Type
- `"IN"` - Stock coming in
- `"OUT"` - Stock going out

### Camera Status
- `"online"` - Camera is active
- `"offline"` - Camera is inactive
