# Dashboard Stats API - Complete Reference

Complete API reference for the main dashboard statistics endpoint.

## Base URL
```
http://localhost:3000/api/dashboard
```

## Authentication
All endpoints require:
```
Authorization: Bearer <token>
```

---

## 1. Get Dashboard Statistics

**Endpoint:** `GET /api/dashboard/stats`

**Description:** Returns comprehensive dashboard statistics including metrics, trends, chart data, recent entries, top warehouses, stock distribution, and low stock alerts.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number for recent stock entries (default: `1`)
- `limit` (optional): Number of recent entries per page (default: `20`, max: `100`)

**Example Request:**
```bash
# Get first page (default 20 entries)
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer <your-token>"

# Get second page with 10 entries per page
curl -X GET "http://localhost:3000/api/dashboard/stats?page=2&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

---

## Response Structure

### Complete Example Response

```json
{
  "metrics": {
    "totalWarehouses": 12,
    "activeWarehouses": 11,
    "inactiveWarehouses": 1,
    "stockEntriesToday": 25,
    "stockEntriesThisWeek": 150,
    "stockEntriesThisMonth": 650,
    "totalCameras": 24,
    "onlineCameras": 22,
    "offlineCameras": 2,
    "totalInspectors": 6,
    "activeInspectors": 5,
    "totalStockItems": 45,
    "lowStockItems": 8
  },
  "trends": {
    "warehouses": {
      "current": 12,
      "previous": 10,
      "change": 20.0,
      "changeType": "increase"
    },
    "stockEntriesToday": {
      "current": 25,
      "previous": 18,
      "change": 38.9,
      "changeType": "increase"
    },
    "stockEntriesThisMonth": {
      "current": 650,
      "previous": 520,
      "change": 25.0,
      "changeType": "increase"
    },
    "activeWarehouses": {
      "current": 11,
      "previous": 9,
      "change": 22.2,
      "changeType": "increase"
    }
  },
  "chartData": [
    {
      "month": "Oct",
      "entries": 450,
      "in": 3000,
      "out": 1500
    },
    {
      "month": "Nov",
      "entries": 520,
      "in": 3500,
      "out": 1700
    },
    {
      "month": "Dec",
      "entries": 480,
      "in": 3200,
      "out": 1600
    },
    {
      "month": "Jan",
      "entries": 550,
      "in": 3800,
      "out": 1700
    },
    {
      "month": "Feb",
      "entries": 600,
      "in": 4000,
      "out": 2000
    },
    {
      "month": "Mar",
      "entries": 650,
      "in": 4500,
      "out": 2000
    }
  ],
  "recentStockEntries": {
    "items": [
      {
        "id": "2e22d44e-4781-41f9-b4b8-614d3c9750d4",
        "itemName": "Electronics - Laptops",
        "type": "IN",
        "quantity": 50,
        "notes": "New shipment from supplier",
        "warehouse": {
          "id": "3bae2090-128c-40ac-8e12-af91d9680567",
          "name": "Karachi Central Warehouse"
        },
        "inspector": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "John Inspector",
          "email": "inspector@warehouse.com"
        },
        "createdAt": "2026-03-05T12:17:00.000Z"
      },
      {
        "id": "3f33e55f-5892-52ga-c5c9-725e4d086167",
        "itemName": "Furniture - Office Chairs",
        "type": "OUT",
        "quantity": 25,
        "notes": "Customer order fulfillment",
        "warehouse": {
          "id": "4cbf31a1-239d-51bd-9f23-bg02e0791678",
          "name": "Lahore North Warehouse"
        },
        "inspector": {
          "id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
          "name": "Jane Inspector",
          "email": "inspector2@warehouse.com"
        },
        "createdAt": "2026-03-05T11:45:00.000Z"
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
  },
  "topWarehouses": [
    {
      "warehouseId": "3bae2090-128c-40ac-8e12-af91d9680567",
      "warehouseName": "Karachi Central Warehouse",
      "totalEntries": 250,
      "entriesThisMonth": 85,
      "totalStock": 1500
    },
    {
      "warehouseId": "4cbf31a1-239d-51bd-9f23-bg02e0791678",
      "warehouseName": "Lahore North Warehouse",
      "totalEntries": 200,
      "entriesThisMonth": 70,
      "totalStock": 1200
    },
    {
      "warehouseId": "5dg42b2-34ae-62ce-0g34-ch13f1802789",
      "warehouseName": "Islamabad Main Warehouse",
      "totalEntries": 180,
      "entriesThisMonth": 65,
      "totalStock": 1100
    },
    {
      "warehouseId": "6eh53c3-45bf-73df-1h45-di24g2913890",
      "warehouseName": "Faisalabad Distribution Center",
      "totalEntries": 150,
      "entriesThisMonth": 55,
      "totalStock": 950
    },
    {
      "warehouseId": "7fi64d4-56cg-84eg-2i56-ej35h3024901",
      "warehouseName": "Rawalpindi Storage Facility",
      "totalEntries": 120,
      "entriesThisMonth": 45,
      "totalStock": 800
    }
  ],
  "stockDistribution": {
    "totalIn": 50000,
    "totalOut": 30000,
    "netStock": 20000,
    "inPercentage": 62.5,
    "outPercentage": 37.5
  },
  "lowStockAlerts": [
    {
      "itemName": "Food - Wheat Flour",
      "warehouseName": "Karachi Central Warehouse",
      "netStock": -40,
      "alertLevel": "critical"
    },
    {
      "itemName": "Textiles - Silk Fabric",
      "warehouseName": "Lahore North Warehouse",
      "netStock": -68,
      "alertLevel": "critical"
    },
    {
      "itemName": "Pharmaceuticals - Medicine A",
      "warehouseName": "Islamabad Main Warehouse",
      "netStock": 2,
      "alertLevel": "warning"
    },
    {
      "itemName": "Electronics - Tablets",
      "warehouseName": "Faisalabad Distribution Center",
      "netStock": 3,
      "alertLevel": "warning"
    }
  ]
}
```

---

## Response Fields Explained

### 1. Metrics Object

| Field | Type | Description |
|-------|------|-------------|
| `totalWarehouses` | number | Total number of warehouses (accessible to user) |
| `activeWarehouses` | number | Number of active warehouses |
| `inactiveWarehouses` | number | Number of inactive warehouses |
| `stockEntriesToday` | number | Count of stock entries created today |
| `stockEntriesThisWeek` | number | Count of stock entries created this week |
| `stockEntriesThisMonth` | number | Count of stock entries created this month |
| `totalCameras` | number | Total number of cameras across all warehouses |
| `onlineCameras` | number | Number of online cameras |
| `offlineCameras` | number | Number of offline cameras |
| `totalInspectors` | number | Total number of inspector users |
| `activeInspectors` | number | Number of inspectors with warehouse assignments |
| `totalStockItems` | number | Count of unique item names across all warehouses |
| `lowStockItems` | number | Count of items with net stock < 10 |

### 2. Trends Object

Each trend object contains:

| Field | Type | Description |
|-------|------|-------------|
| `current` | number | Current period value |
| `previous` | number | Previous period value (for comparison) |
| `change` | number | Percentage change (rounded to 1 decimal) |
| `changeType` | string | `"increase"`, `"decrease"`, or `"neutral"` |

**Available Trends:**
- `warehouses` - Total warehouses trend (vs 30 days ago)
- `stockEntriesToday` - Today's entries trend (vs yesterday)
- `stockEntriesThisMonth` - This month's entries trend (vs last month)
- `activeWarehouses` - Active warehouses trend (vs last month)

### 3. Chart Data Array

Array of objects for the last 6 months:

| Field | Type | Description |
|-------|------|-------------|
| `month` | string | Month abbreviation (Jan, Feb, Mar, etc.) |
| `entries` | number | Total number of stock entries in that month |
| `in` | number | Total quantity of IN entries for that month |
| `out` | number | Total quantity of OUT entries for that month |

### 4. Recent Stock Entries Object

Object containing paginated recent stock entries:

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of recent stock entries (paginated) |
| `items[].id` | string (UUID) | Stock entry ID |
| `items[].itemName` | string | Name of the item |
| `items[].type` | string | `"IN"` or `"OUT"` |
| `items[].quantity` | number | Quantity of items |
| `items[].notes` | string \| null | Optional notes |
| `items[].warehouse` | object | Warehouse information |
| `items[].warehouse.id` | string (UUID) | Warehouse ID |
| `items[].warehouse.name` | string | Warehouse name |
| `items[].inspector` | object | Inspector information |
| `items[].inspector.id` | string (UUID) | Inspector user ID |
| `items[].inspector.name` | string | Inspector name |
| `items[].inspector.email` | string | Inspector email |
| `items[].createdAt` | string (ISO 8601) | Entry creation timestamp |
| `pagination` | object | Pagination metadata |
| `pagination.page` | number | Current page number |
| `pagination.limit` | number | Items per page |
| `pagination.totalPages` | number | Total number of pages |
| `pagination.totalItems` | number | Total number of entries |
| `pagination.hasNextPage` | boolean | Whether there is a next page |
| `pagination.hasPrevPage` | boolean | Whether there is a previous page |

### 5. Top Warehouses Array

Array of top 5 warehouses by activity:

| Field | Type | Description |
|-------|------|-------------|
| `warehouseId` | string (UUID) | Warehouse ID |
| `warehouseName` | string | Warehouse name |
| `totalEntries` | number | Total stock entries for this warehouse |
| `entriesThisMonth` | number | Stock entries this month |
| `totalStock` | number | Net stock (IN - OUT) for this warehouse |

### 6. Stock Distribution Object

Overall stock distribution statistics:

| Field | Type | Description |
|-------|------|-------------|
| `totalIn` | number | Total quantity of all IN entries |
| `totalOut` | number | Total quantity of all OUT entries |
| `netStock` | number | Net stock (totalIn - totalOut) |
| `inPercentage` | number | Percentage of IN entries (rounded to 1 decimal) |
| `outPercentage` | number | Percentage of OUT entries (rounded to 1 decimal) |

### 7. Low Stock Alerts Array

Array of critical stock alerts (top 10 most critical):

| Field | Type | Description |
|-------|------|-------------|
| `itemName` | string | Name of the item |
| `warehouseName` | string | Warehouse where item is low |
| `netStock` | number | Current net stock (can be negative) |
| `alertLevel` | string | `"critical"` (netStock < 0) or `"warning"` (netStock < 5) |

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
interface DashboardStats {
  metrics: {
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
    stockEntriesToday: number;
    stockEntriesThisWeek: number;
    stockEntriesThisMonth: number;
    totalCameras: number;
    onlineCameras: number;
    offlineCameras: number;
    totalInspectors: number;
    activeInspectors: number;
    totalStockItems: number;
    lowStockItems: number;
  };
  trends: {
    [key: string]: {
      current: number;
      previous: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'neutral';
    };
  };
  chartData: Array<{
    month: string;
    entries: number;
    in: number;
    out: number;
  }>;
  recentStockEntries: {
    items: Array<{
      id: string;
      itemName: string;
      type: 'IN' | 'OUT';
      quantity: number;
      notes: string | null;
      warehouse: {
        id: string;
        name: string;
      };
      inspector: {
        id: string;
        name: string;
        email: string;
      };
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  topWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    totalEntries: number;
    entriesThisMonth: number;
    totalStock: number;
  }>;
  stockDistribution: {
    totalIn: number;
    totalOut: number;
    netStock: number;
    inPercentage: number;
    outPercentage: number;
  };
  lowStockAlerts: Array<{
    itemName: string;
    warehouseName: string;
    netStock: number;
    alertLevel: 'critical' | 'warning';
  }>;
}

const fetchDashboardStats = async (token: string): Promise<DashboardStats> => {
  const response = await fetch('http://localhost:3000/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  
  return response.json();
};
```

### JavaScript Example

```javascript
const fetchDashboardStats = async (token) => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    
    const data = await response.json();
    
    // Use the data
    console.log('Total Warehouses:', data.metrics.totalWarehouses);
    console.log('Stock Entries Today:', data.metrics.stockEntriesToday);
    console.log('Trend:', data.trends.stockEntriesToday);
    console.log('Chart Data:', data.chartData);
    console.log('Recent Entries:', data.recentStockEntries.items);
    console.log('Pagination:', data.recentStockEntries.pagination);
    console.log('Top Warehouses:', data.topWarehouses);
    console.log('Stock Distribution:', data.stockDistribution);
    console.log('Low Stock Alerts:', data.lowStockAlerts);
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
```

### Using with Chart.js

```javascript
// Prepare chart data
const chartData = {
  labels: dashboardStats.chartData.map(d => d.month),
  datasets: [
    {
      label: 'Stock IN',
      data: dashboardStats.chartData.map(d => d.in),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)'
    },
    {
      label: 'Stock OUT',
      data: dashboardStats.chartData.map(d => d.out),
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    },
    {
      label: 'Total Entries',
      data: dashboardStats.chartData.map(d => d.entries),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }
  ]
};
```

### Using Pagination for Recent Entries

```javascript
// Fetch first page (default 20 entries)
const fetchDashboardStats = async (page = 1, limit = 20) => {
  const response = await fetch(
    `http://localhost:3000/api/dashboard/stats?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  // Access recent entries
  const recentEntries = data.recentStockEntries.items;
  const pagination = data.recentStockEntries.pagination;
  
  // Use pagination info
  console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
  console.log(`Showing ${recentEntries.length} of ${pagination.totalItems} entries`);
  
  // Navigate pages
  if (pagination.hasNextPage) {
    // Load next page
    const nextPage = await fetchDashboardStats(pagination.page + 1, limit);
  }
  
  return data;
};

// React component example
const RecentEntriesList = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`http://localhost:3000/api/dashboard/stats?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setData(data));
  }, [page, limit]);
  
  if (!data) return <div>Loading...</div>;
  
  const { items, pagination } = data.recentStockEntries;
  
  return (
    <div>
      <h2>Recent Stock Entries</h2>
      <ul>
        {items.map(entry => (
          <li key={entry.id}>
            {entry.itemName} - {entry.type} - {entry.quantity}
          </li>
        ))}
      </ul>
      
      {/* Pagination Controls */}
      <div>
        <button 
          disabled={!pagination.hasPrevPage}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          disabled={!pagination.hasNextPage}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

### Displaying Trends

```javascript
// Display trend with icon
const TrendCard = ({ trend, label }) => {
  const isIncrease = trend.changeType === 'increase';
  const isDecrease = trend.changeType === 'decrease';
  
  return (
    <div>
      <h3>{label}</h3>
      <p>Current: {trend.current}</p>
      <p>Previous: {trend.previous}</p>
      <p>
        {isIncrease && '↑'} 
        {isDecrease && '↓'} 
        {Math.abs(trend.change)}%
      </p>
    </div>
  );
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

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Role-Based Access

- **Super Admin**: Sees all warehouses and their data
- **Permanent Secretary**: Sees all warehouses and their data (read-only)
- **Inspector**: Only sees data for assigned warehouses

The API automatically filters data based on the user's role and permissions.

---

## Performance Notes

- Response time: Typically < 2 seconds
- Data is calculated in real-time (no caching)
- Consider implementing client-side caching (5-10 minutes) for better UX
- All dates are in UTC format

---

## Testing

### Using cURL

```bash
# Get dashboard stats
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Using Postman

1. Method: `GET`
2. URL: `http://localhost:3000/api/dashboard/stats`
3. Headers:
   - `Authorization`: `Bearer <your-token>`
   - `Content-Type`: `application/json`

---

## Summary

This endpoint provides everything needed for a comprehensive dashboard:

✅ **Metrics Cards**: All key statistics  
✅ **Trend Indicators**: Real percentage changes with direction  
✅ **Chart Data**: Last 6 months of activity  
✅ **Recent Activity**: Latest stock entries  
✅ **Top Performers**: Most active warehouses  
✅ **Stock Overview**: IN/OUT distribution  
✅ **Alerts**: Low stock warnings  

All data is role-aware and automatically filtered based on user permissions.
