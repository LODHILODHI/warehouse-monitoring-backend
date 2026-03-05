# Inspector API Reference

Complete API reference for inspector-specific endpoints.

## Base URL
```
http://localhost:3000/api/inspector
```

## Authentication
All endpoints require:
```
Authorization: Bearer <token>
```

## Access Control
- **Only users with role `inspector` can access these endpoints**
- Inspectors can only access data for warehouses assigned to them
- All endpoints automatically filter data based on inspector's assignments

---

## 1. Get Inspector Dashboard

**Endpoint:** `GET /api/inspector/dashboard`

**Description:** Returns a comprehensive dashboard summary for the logged-in inspector including assigned warehouses, statistics, and recent activity.

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/inspector/dashboard \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "inspector": {
    "id": "uuid",
    "name": "John Inspector",
    "email": "inspector@warehouse.com",
    "role": "inspector",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "assignedWarehouses": [
    {
      "id": "uuid",
      "name": "Karachi Central Warehouse",
      "address": "Industrial Area, SITE, Karachi, Sindh 75700",
      "latitude": 24.8607,
      "longitude": 67.0011,
      "status": "active",
      "assignedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "statistics": {
    "totalStockIn": 5000,
    "totalStockOut": 3000,
    "netStock": 2000,
    "totalEntries": 150,
    "entriesToday": 5,
    "entriesThisWeek": 25,
    "entriesThisMonth": 80
  },
  "recentActivity": [
    {
      "id": "uuid",
      "itemName": "Electronics - Laptops",
      "type": "IN",
      "quantity": 50,
      "notes": "New shipment",
      "warehouse": {
        "id": "uuid",
        "name": "Karachi Central Warehouse"
      },
      "createdAt": "2024-03-05T12:17:00.000Z"
    }
  ]
}
```

---

## 2. Get Inspector Stock Entries

**Endpoint:** `GET /api/inspector/stock`

**Description:** Returns stock entries for all warehouses assigned to the inspector. Supports filtering and pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by entry type - `IN` or `OUT`
- `warehouseId` (optional): Filter by specific warehouse (must be assigned to inspector)
- `page` (optional): Page number (default: `1`)
- `limit` (optional): Items per page (default: `20`, max: `100`)

**Example Requests:**
```bash
# Get all entries
curl -X GET http://localhost:3000/api/inspector/stock \
  -H "Authorization: Bearer <your-token>"

# Filter by type
curl -X GET "http://localhost:3000/api/inspector/stock?type=IN" \
  -H "Authorization: Bearer <your-token>"

# Filter by warehouse
curl -X GET "http://localhost:3000/api/inspector/stock?warehouseId=<uuid>" \
  -H "Authorization: Bearer <your-token>"

# Pagination
curl -X GET "http://localhost:3000/api/inspector/stock?page=2&limit=10" \
  -H "Authorization: Bearer <your-token>"

# Combined filters
curl -X GET "http://localhost:3000/api/inspector/stock?type=IN&warehouseId=<uuid>&page=1&limit=20" \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "itemName": "Electronics - Laptops",
      "type": "IN",
      "quantity": 50,
      "notes": "New shipment from supplier",
      "warehouse": {
        "id": "uuid",
        "name": "Karachi Central Warehouse",
        "address": "Industrial Area, SITE, Karachi, Sindh 75700"
      },
      "inspector": {
        "id": "uuid",
        "name": "John Inspector",
        "email": "inspector@warehouse.com"
      },
      "createdAt": "2024-03-05T12:17:00.000Z",
      "updatedAt": "2024-03-05T12:17:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Responses:**
- `403`: Access denied if trying to filter by unassigned warehouse
- `500`: Internal server error

---

## 3. Get Inspector Cameras

**Endpoint:** `GET /api/inspector/cameras`

**Description:** Returns all cameras for warehouses assigned to the inspector. Inspectors have read-only access to camera streams.

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/inspector/cameras \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "cameras": [
    {
      "id": "uuid",
      "name": "Main Entrance Camera",
      "streamUrl": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "status": "online",
      "warehouse": {
        "id": "uuid",
        "name": "Karachi Central Warehouse"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "warehouses": [
    {
      "id": "uuid",
      "name": "Karachi Central Warehouse",
      "address": "Industrial Area, SITE, Karachi, Sindh 75700",
      "status": "active",
      "cameras": [
        {
          "id": "uuid",
          "name": "Main Entrance Camera",
          "streamUrl": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          "status": "online",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "summary": {
    "total": 4,
    "online": 3,
    "offline": 1
  }
}
```

**Inspector Restrictions:**
- ✅ Can view camera streams
- ❌ Cannot add cameras
- ❌ Cannot delete cameras
- ❌ Cannot modify stream URLs

---

## 4. Get Inspector Warehouses

**Endpoint:** `GET /api/inspector/warehouses`

**Description:** Returns list of all warehouses assigned to the inspector.

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/inspector/warehouses \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "warehouses": [
    {
      "id": "uuid",
      "name": "Karachi Central Warehouse",
      "address": "Industrial Area, SITE, Karachi, Sindh 75700",
      "latitude": 24.8607,
      "longitude": 67.0011,
      "status": "active",
      "assignedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Lahore North Warehouse",
      "address": "Ferozepur Road, Lahore, Punjab 54600",
      "latitude": 31.5204,
      "longitude": 74.3587,
      "status": "active",
      "assignedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
interface InspectorDashboard {
  inspector: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  assignedWarehouses: Array<{
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    assignedAt: string;
  }>;
  statistics: {
    totalStockIn: number;
    totalStockOut: number;
    netStock: number;
    totalEntries: number;
    entriesToday: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    itemName: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string | null;
    warehouse: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>;
}

const fetchInspectorDashboard = async (token: string): Promise<InspectorDashboard> => {
  const response = await fetch('http://localhost:3000/api/inspector/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch inspector dashboard');
  }
  
  return response.json();
};
```

### JavaScript Example

```javascript
// Fetch inspector dashboard
const fetchInspectorDashboard = async (token) => {
  try {
    const response = await fetch('http://localhost:3000/api/inspector/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }
    
    const data = await response.json();
    console.log('Inspector:', data.inspector);
    console.log('Assigned Warehouses:', data.assignedWarehouses);
    console.log('Statistics:', data.statistics);
    console.log('Recent Activity:', data.recentActivity);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Fetch stock entries with filters
const fetchStockEntries = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);
  
  const response = await fetch(
    `http://localhost:3000/api/inspector/stock?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
};

// Fetch cameras
const fetchCameras = async (token) => {
  const response = await fetch('http://localhost:3000/api/inspector/cameras', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Inspector role required."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Security Features

1. **Role-Based Access Control:**
   - Only users with `role = "inspector"` can access these endpoints
   - Middleware automatically checks role before processing requests

2. **Warehouse Assignment Validation:**
   - Inspectors can only access data for assigned warehouses
   - Attempting to access unassigned warehouse data returns 403 error

3. **Automatic Data Filtering:**
   - All queries automatically filter by inspector's assigned warehouses
   - No need to manually specify warehouse IDs in most cases

---

## Testing

### Using cURL

```bash
# Get dashboard
curl -X GET http://localhost:3000/api/inspector/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get stock entries
curl -X GET "http://localhost:3000/api/inspector/stock?type=IN&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get cameras
curl -X GET http://localhost:3000/api/inspector/cameras \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get warehouses
curl -X GET http://localhost:3000/api/inspector/warehouses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Set Authorization header: `Bearer <token>`
2. Make sure you're logged in as an inspector
3. Test each endpoint

---

## Summary

All inspector-specific endpoints:

1. ✅ `GET /api/inspector/dashboard` - Dashboard summary
2. ✅ `GET /api/inspector/stock` - Stock entries with filters
3. ✅ `GET /api/inspector/cameras` - Assigned warehouse cameras
4. ✅ `GET /api/inspector/warehouses` - Assigned warehouses list

All endpoints are:
- ✅ Protected by authentication
- ✅ Restricted to inspector role only
- ✅ Automatically filter by assigned warehouses
- ✅ Follow clean architecture principles
- ✅ Include proper error handling
