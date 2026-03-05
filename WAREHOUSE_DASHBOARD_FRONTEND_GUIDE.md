# Warehouse Dashboard - Complete Frontend Integration Guide

This guide provides all APIs and implementation details for building a comprehensive warehouse-specific dashboard.

## Overview

When a user clicks on a warehouse from the map, they should see a complete dashboard with:
- Warehouse statistics
- Camera streams
- Recent stock activity
- Inventory summary
- Assigned inspectors
- Charts and graphs

---

## API Endpoints

### 1. Get Warehouse Statistics

**Endpoint:** `GET /api/warehouses/:id/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "warehouse": {
    "id": "uuid",
    "name": "Karachi Central Warehouse"
  },
  "statistics": {
    "stockEntries": {
      "total": 150,
      "today": 5,
      "thisWeek": 25,
      "thisMonth": 80
    },
    "stockSummary": {
      "totalIn": 5000,
      "totalOut": 3200,
      "netStock": 1800
    },
    "cameras": {
      "total": 2,
      "online": 2,
      "offline": 0
    },
    "inspectors": {
      "assigned": 2
    },
    "lastActivity": "2024-03-03T10:30:00.000Z"
  }
}
```

---

### 2. Get Recent Stock Entries

**Endpoint:** `GET /api/warehouses/:id/recent-entries?limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 10)

**Response:**
```json
{
  "warehouse": {
    "id": "uuid",
    "name": "Karachi Central Warehouse"
  },
  "recentEntries": [
    {
      "id": "uuid",
      "itemName": "Product A",
      "type": "IN",
      "quantity": 100,
      "notes": "New shipment",
      "inspector": {
        "id": "uuid",
        "name": "John Inspector",
        "email": "inspector@warehouse.com"
      },
      "createdAt": "2024-03-03T10:30:00.000Z"
    }
  ],
  "count": 10
}
```

---

### 3. Get Inventory Summary

**Endpoint:** `GET /api/warehouses/:id/inventory`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "warehouse": {
    "id": "uuid",
    "name": "Karachi Central Warehouse"
  },
  "inventory": {
    "items": [
      {
        "itemName": "Product A",
        "totalIn": 500,
        "totalOut": 200,
        "netStock": 300,
        "entryCount": 15
      },
      {
        "itemName": "Product B",
        "totalIn": 300,
        "totalOut": 290,
        "netStock": 10,
        "entryCount": 12
      }
    ],
    "totalItems": 25,
    "lowStockItems": 3,
    "lowStockAlerts": [
      {
        "itemName": "Product B",
        "netStock": 10,
        "alert": "Low stock"
      }
    ]
  }
}
```

---

### 4. Get Warehouse Details (Existing)

**Endpoint:** `GET /api/warehouses/:id`

**Response includes:**
- Warehouse info
- Cameras list
- Assigned inspectors

---

### 5. Get Warehouse Cameras (Existing)

**Endpoint:** `GET /api/warehouses/:id/cameras`

**Response includes:**
- Camera streams with URLs

---

## Complete Dashboard Component Example

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function WarehouseDashboard() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (id) {
      fetchDashboardData();
    }
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        warehouseRes,
        statsRes,
        recentEntriesRes,
        inventoryRes,
        camerasRes
      ] = await Promise.all([
        fetch(`http://localhost:3000/api/warehouses/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/warehouses/${id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/warehouses/${id}/recent-entries?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/warehouses/${id}/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/warehouses/${id}/cameras`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const warehouseData = await warehouseRes.json();
      const statsData = await statsRes.json();
      const recentEntriesData = await recentEntriesRes.json();
      const inventoryData = await inventoryRes.json();
      const camerasData = await camerasRes.json();

      setWarehouse(warehouseData.warehouse);
      setStats(statsData.statistics);
      setRecentEntries(recentEntriesData.recentEntries);
      setInventory(inventoryData.inventory);
      setCameras(camerasData.cameras);
      setInspectors(warehouseData.warehouse.assignedInspectors || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="warehouse-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{warehouse.name}</h1>
          <p>{warehouse.address}</p>
          <span className={`status ${warehouse.status}`}>
            {warehouse.status}
          </span>
        </div>
        <div className="actions">
          <button onClick={fetchDashboardData}>Refresh</button>
          {user?.role === 'super_admin' && (
            <button onClick={handleEditWarehouse}>Edit Warehouse</button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Entries"
          value={stats.stockEntries.total}
          icon="📦"
        />
        <StatCard
          title="Entries Today"
          value={stats.stockEntries.today}
          icon="📅"
        />
        <StatCard
          title="Net Stock"
          value={stats.stockSummary.netStock}
          icon="📊"
        />
        <StatCard
          title="Online Cameras"
          value={`${stats.cameras.online}/${stats.cameras.total}`}
          icon="📹"
        />
        <StatCard
          title="Assigned Inspectors"
          value={stats.inspectors.assigned}
          icon="👥"
        />
        <StatCard
          title="Total IN"
          value={stats.stockSummary.totalIn}
          icon="⬆️"
        />
        <StatCard
          title="Total OUT"
          value={stats.stockSummary.totalOut}
          icon="⬇️"
        />
        <StatCard
          title="This Month"
          value={stats.stockEntries.thisMonth}
          icon="📈"
        />
      </div>

      {/* Camera Streams Section */}
      <div className="cameras-section">
        <h2>Live Camera Streams</h2>
        <div className="camera-grid">
          {cameras.map(camera => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      </div>

      {/* Recent Stock Activity */}
      <div className="recent-entries-section">
        <h2>Recent Stock Activity</h2>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Inspector</th>
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {recentEntries.map(entry => (
              <tr key={entry.id}>
                <td>{entry.itemName}</td>
                <td>
                  <span className={`type ${entry.type}`}>
                    {entry.type}
                  </span>
                </td>
                <td>{entry.quantity}</td>
                <td>{entry.inspector.name}</td>
                <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                <td>{entry.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inventory Summary */}
      <div className="inventory-section">
        <h2>Inventory Summary</h2>
        {inventory.lowStockAlerts.length > 0 && (
          <div className="alerts">
            <h3>⚠️ Low Stock Alerts</h3>
            {inventory.lowStockAlerts.map(alert => (
              <div key={alert.itemName} className="alert">
                {alert.itemName}: Only {alert.netStock} units remaining
              </div>
            ))}
          </div>
        )}
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Total IN</th>
                <th>Total OUT</th>
                <th>Net Stock</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              {inventory.items.map(item => (
                <tr key={item.itemName}>
                  <td>{item.itemName}</td>
                  <td>{item.totalIn}</td>
                  <td>{item.totalOut}</td>
                  <td className={item.netStock < 10 ? 'low-stock' : ''}>
                    {item.netStock}
                  </td>
                  <td>{item.entryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assigned Inspectors */}
      <div className="inspectors-section">
        <h2>Assigned Inspectors</h2>
        <div className="inspectors-grid">
          {inspectors.map(inspector => (
            <div key={inspector.id} className="inspector-card">
              <div className="avatar">{inspector.name[0]}</div>
              <h3>{inspector.name}</h3>
              <p>{inspector.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
}

// Camera Card Component
function CameraCard({ camera }) {
  return (
    <div className="camera-card">
      <div className="camera-header">
        <h3>{camera.name}</h3>
        <span className={`status ${camera.status}`}>
          {camera.status}
        </span>
      </div>
      {camera.status === 'online' ? (
        <video
          src={camera.streamUrl}
          controls
          className="camera-stream"
          autoPlay
          muted
        />
      ) : (
        <div className="offline-placeholder">
          Camera Offline
        </div>
      )}
    </div>
  );
}

export default WarehouseDashboard;
```

---

## Dashboard Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Warehouse Header                               │
│  [Name] [Status] [Actions]                      │
├─────────────────────────────────────────────────┤
│  Statistics Cards (8 cards in grid)             │
│  [Total] [Today] [Net Stock] [Cameras]         │
│  [Inspectors] [Total IN] [Total OUT] [Month]   │
├─────────────────────────────────────────────────┤
│  📹 Live Camera Streams                         │
│  [Camera 1] [Camera 2] [Camera 3] [Camera 4]   │
├─────────────────────────────────────────────────┤
│  📦 Recent Stock Activity                       │
│  [Table with last 10 entries]                  │
├─────────────────────────────────────────────────┤
│  📊 Inventory Summary                           │
│  [Low Stock Alerts] [Inventory Table]           │
├─────────────────────────────────────────────────┤
│  👥 Assigned Inspectors                         │
│  [Inspector Cards]                              │
└─────────────────────────────────────────────────┘
```

---

## API Response Summary

### Complete Dashboard Data Structure

```typescript
interface WarehouseDashboard {
  warehouse: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
    assignedInspectors: Inspector[];
    cameras: Camera[];
  };
  statistics: {
    stockEntries: {
      total: number;
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    stockSummary: {
      totalIn: number;
      totalOut: number;
      netStock: number;
    };
    cameras: {
      total: number;
      online: number;
      offline: number;
    };
    inspectors: {
      assigned: number;
    };
    lastActivity: string | null;
  };
  recentEntries: StockEntry[];
  inventory: {
    items: InventoryItem[];
    totalItems: number;
    lowStockItems: number;
    lowStockAlerts: Alert[];
  };
}
```

---

## Quick Implementation Steps

1. **Create Warehouse Dashboard Route:**
   ```jsx
   <Route path="/warehouse/:id/dashboard" element={<WarehouseDashboard />} />
   ```

2. **Update Map Component:**
   ```jsx
   // When warehouse pin is clicked
   const handleWarehouseClick = (warehouseId) => {
     navigate(`/warehouse/${warehouseId}/dashboard`);
   };
   ```

3. **Fetch All Data:**
   - Use `Promise.all()` to fetch all APIs in parallel
   - Show loading state while fetching
   - Handle errors gracefully

4. **Display Components:**
   - Statistics cards (8 cards)
   - Camera grid (2-4 cameras)
   - Recent entries table
   - Inventory summary table
   - Inspectors list

---

## CSS Styling Suggestions

```css
.warehouse-dashboard {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.camera-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.low-stock {
  color: red;
  font-weight: bold;
}
```

---

## Testing

### Test Endpoints:
1. `GET /api/warehouses/:id/stats`
2. `GET /api/warehouses/:id/recent-entries`
3. `GET /api/warehouses/:id/inventory`
4. `GET /api/warehouses/:id/cameras`

### Expected Behavior:
- All endpoints return data for the specified warehouse
- Statistics are calculated correctly
- Recent entries are sorted by date (newest first)
- Inventory shows items with net stock calculations
- Low stock alerts work correctly

---

## Notes

- All endpoints require authentication
- Inspectors can only access assigned warehouses
- Super admin and permanent_secretary can access all warehouses
- Use proper error handling for failed API calls
- Implement loading states for better UX
- Consider caching data for better performance
