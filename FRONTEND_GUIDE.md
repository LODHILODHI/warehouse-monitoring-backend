# Frontend Development Guide - Warehouse Monitoring System

## API Base URL
```
http://localhost:3000/api
```

## Authentication Flow

### 1. Login
**Endpoint:** `POST /api/login`

**Request:**
```json
{
  "email": "inspector@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "inspector@example.com",
    "role": "inspector"
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid credentials"
}
```

### 2. Storing Token
- Store JWT token in `localStorage` or `sessionStorage`
- Include in all authenticated requests: `Authorization: Bearer <token>`

---

## API Endpoints

### Authentication

#### POST /api/login
Login and get JWT token.

**No authentication required**

---

### Warehouses

#### POST /api/warehouses
Create a new warehouse (Super Admin only)

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
  "address": "123 Main St, City, State 12345",
  "status": "active"
}
```

**Response (201):**
```json
{
  "message": "Warehouse created successfully",
  "warehouse": {
    "id": "uuid",
    "name": "Warehouse A",
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "address": "123 Main St, City, State 12345",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/warehouses
Get all warehouses (Authenticated users)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "warehouses": [
    {
      "id": "uuid",
      "name": "Warehouse A",
      "latitude": "40.7128",
      "longitude": "-74.0060",
      "address": "123 Main St, City, State 12345",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Stock Entries

#### POST /api/stock
Create a stock entry (Inspector only, must be assigned to warehouse)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "warehouseId": "uuid",
  "type": "IN",
  "itemName": "Product ABC",
  "quantity": 100,
  "notes": "Received from supplier"
}
```

**Response (201):**
```json
{
  "message": "Stock entry created successfully",
  "stockEntry": {
    "id": "uuid",
    "warehouseId": "uuid",
    "inspectorId": "uuid",
    "type": "IN",
    "itemName": "Product ABC",
    "quantity": 100,
    "notes": "Received from supplier",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `403`: Not assigned to warehouse / Not an inspector
- `404`: Warehouse not found

#### GET /api/stock/:warehouseId
Get stock entries for a warehouse

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
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
      "itemName": "Product ABC",
      "quantity": 100,
      "notes": "Received from supplier",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
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

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## User Roles

### Super Admin
- Can create warehouses
- Can view all warehouses
- Can view stock entries for all warehouses

### Inspector
- Can view assigned warehouses only
- Can create stock entries for assigned warehouses only
- Can view stock entries for assigned warehouses only

---

## Suggested Frontend Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Card.jsx
│   │   └── Table.jsx
│   ├── auth/
│   │   └── LoginForm.jsx
│   ├── warehouse/
│   │   ├── WarehouseList.jsx
│   │   ├── WarehouseCard.jsx
│   │   └── CreateWarehouseForm.jsx
│   └── stock/
│       ├── StockEntryList.jsx
│       ├── StockEntryCard.jsx
│       └── CreateStockEntryForm.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Warehouses.jsx
│   ├── WarehouseDetail.jsx
│   └── Stock.jsx
├── services/
│   ├── api.js
│   └── auth.js
├── context/
│   └── AuthContext.jsx
├── hooks/
│   ├── useAuth.js
│   └── useApi.js
├── utils/
│   └── constants.js
└── App.jsx
```

---

## Dashboard Features (Based on Screenshot Reference)

### 1. Overview Dashboard
- **Key Metrics Cards:**
  - Total Warehouses
  - Active Warehouses
  - Total Stock Entries (Today/This Month)
  - Recent Activity Count

- **Charts:**
  - Stock Entries Over Time (Line Chart)
  - Stock Entries by Warehouse (Bar Chart)
  - IN vs OUT Entries (Pie Chart)

- **Recent Stock Entries Table:**
  - Item Name
  - Warehouse
  - Type (IN/OUT)
  - Quantity
  - Inspector
  - Date/Time
  - Status Badge

### 2. Warehouses Page
- **Warehouse Cards/List:**
  - Warehouse Name
  - Status Badge (Active/Inactive)
  - Address
  - Location (Latitude, Longitude)
  - Total Stock Entries
  - Action Buttons (View Details, Edit - Super Admin only)

- **Create Warehouse Form** (Super Admin only)
  - Name input
  - Latitude/Longitude inputs
  - Address textarea
  - Status dropdown

### 3. Stock Entries Page
- **Filter Options:**
  - By Warehouse
  - By Type (IN/OUT)
  - Date Range
  - Search by Item Name

- **Stock Entries Table:**
  - Item Name
  - Type (IN/OUT) with color coding
  - Quantity
  - Warehouse
  - Inspector
  - Date/Time
  - Notes

- **Create Stock Entry Form** (Inspector only)
  - Warehouse dropdown (only assigned warehouses)
  - Type radio/select (IN/OUT)
  - Item Name input
  - Quantity input (number)
  - Notes textarea

### 4. Warehouse Detail Page
- Warehouse Information Card
- Stock Entries List for that warehouse
- Create Stock Entry Form (if inspector is assigned)
- Map View (if using maps library)

---

## React Implementation Tips

### 1. API Service Setup
```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Auth Context
```javascript
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Protected Route Component
```javascript
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};
```

---

## UI Components Suggestions

### Based on Screenshot Reference:

1. **Sidebar Navigation:**
   - Dashboard
   - Warehouses
   - Stock Entries
   - Settings (Super Admin only)
   - Profile
   - Logout

2. **Header:**
   - User profile dropdown
   - Notifications (if needed)
   - Theme toggle (optional)

3. **Cards:**
   - Metric cards with icons
   - Percentage changes with up/down arrows
   - Charts integration

4. **Tables:**
   - Sortable columns
   - Status badges (color-coded)
   - Action buttons
   - Pagination

5. **Forms:**
   - Validation
   - Error messages
   - Loading states
   - Success notifications

---

## Required NPM Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "recharts": "^2.5.0",  // For charts
    "date-fns": "^2.29.3",  // For date formatting
    "react-hot-toast": "^2.4.0"  // For notifications
  }
}
```

---

## Color Coding Suggestions

- **Status Active:** Green (#10b981)
- **Status Inactive:** Gray (#6b7280)
- **Type IN:** Green (#10b981)
- **Type OUT:** Red (#ef4444)
- **Success:** Green
- **Error:** Red
- **Warning:** Yellow
- **Info:** Blue

---

## Sample Dashboard Data Structure

```javascript
const dashboardData = {
  metrics: {
    totalWarehouses: 10,
    activeWarehouses: 8,
    stockEntriesToday: 45,
    stockEntriesThisMonth: 1200
  },
  recentStockEntries: [
    {
      id: "uuid",
      itemName: "Product ABC",
      warehouse: "Warehouse A",
      type: "IN",
      quantity: 100,
      inspector: "John Doe",
      createdAt: "2024-01-01T10:00:00Z"
    }
  ],
  chartData: {
    stockEntriesOverTime: [
      { month: "Jan", entries: 120 },
      { month: "Feb", entries: 150 }
    ]
  }
};
```

---

## Next Steps for Frontend

1. Set up React Router
2. Create Auth Context and Protected Routes
3. Build Login Page
4. Create Dashboard with metrics
5. Build Warehouse List and Detail pages
6. Create Stock Entry forms and lists
7. Add charts and visualizations
8. Implement role-based UI restrictions
9. Add error handling and loading states
10. Style with your preferred UI library (Tailwind, Material-UI, etc.)
