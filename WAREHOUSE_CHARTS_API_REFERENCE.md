# Warehouse Dashboard Charts - API Reference

Complete API reference for all chart/analytics endpoints for warehouse dashboard.

## Base URL
```
http://localhost:3000/api/warehouses/:id
```

## Authentication
All endpoints require:
```
Authorization: Bearer <token>
```

---

## 1. Stock Entries Over Time (Line/Area Chart)

**Endpoint:** `GET /api/warehouses/:id/stock-trends`

**Query Parameters:**
- `period` (optional): `week` | `month` | `year` (default: `month`)

**Example Request:**
```
GET /api/warehouses/abc123/stock-trends?period=week
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "trends": [
    {
      "date": "2024-03-01",
      "in": 150,
      "out": 50,
      "net": 100
    },
    {
      "date": "2024-03-02",
      "in": 200,
      "out": 75,
      "net": 125
    }
  ],
  "period": "week"
}
```

**Frontend Usage (Chart.js Example):**
```javascript
const fetchStockTrends = async (warehouseId, period = 'month') => {
  const response = await fetch(
    `http://localhost:3000/api/warehouses/${warehouseId}/stock-trends?period=${period}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  // Chart.js data format
  return {
    labels: data.trends.map(t => t.date),
    datasets: [
      {
        label: 'Stock IN',
        data: data.trends.map(t => t.in),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)'
      },
      {
        label: 'Stock OUT',
        data: data.trends.map(t => t.out),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
      },
      {
        label: 'Net Stock',
        data: data.trends.map(t => t.net),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
  };
};
```

---

## 2. Top Items by Quantity (Bar Chart)

**Endpoint:** `GET /api/warehouses/:id/top-items`

**Query Parameters:**
- `limit` (optional): Number of items to return (default: `10`)

**Example Request:**
```
GET /api/warehouses/abc123/top-items?limit=10
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "topItems": [
    {
      "itemName": "Product A",
      "totalIn": 5000,
      "totalOut": 3200,
      "netStock": 1800,
      "entryCount": 25
    },
    {
      "itemName": "Product B",
      "totalIn": 3000,
      "totalOut": 2900,
      "netStock": 100,
      "entryCount": 18
    }
  ]
}
```

**Frontend Usage (Chart.js Bar Chart):**
```javascript
const fetchTopItems = async (warehouseId, limit = 10) => {
  const response = await fetch(
    `http://localhost:3000/api/warehouses/${warehouseId}/top-items?limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  return {
    labels: data.topItems.map(item => item.itemName),
    datasets: [
      {
        label: 'Net Stock',
        data: data.topItems.map(item => item.netStock),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };
};
```

---

## 3. Activity Timeline (Timeline Chart)

**Endpoint:** `GET /api/warehouses/:id/activity-timeline`

**Query Parameters:**
- `days` (optional): Number of days to include (default: `7`)

**Example Request:**
```
GET /api/warehouses/abc123/activity-timeline?days=7
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "timeline": [
    {
      "date": "2024-03-01",
      "entries": 15,
      "inspectors": 2,
      "cameras": 4
    },
    {
      "date": "2024-03-02",
      "entries": 20,
      "inspectors": 2,
      "cameras": 4
    }
  ]
}
```

**Frontend Usage:**
```javascript
const fetchActivityTimeline = async (warehouseId, days = 7) => {
  const response = await fetch(
    `http://localhost:3000/api/warehouses/${warehouseId}/activity-timeline?days=${days}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  return {
    labels: data.timeline.map(t => t.date),
    datasets: [
      {
        label: 'Stock Entries',
        data: data.timeline.map(t => t.entries),
        borderColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Active Inspectors',
        data: data.timeline.map(t => t.inspectors),
        borderColor: 'rgb(34, 197, 94)'
      }
    ]
  };
};
```

---

## 4. Stock Distribution (Pie/Doughnut Chart)

**Endpoint:** `GET /api/warehouses/:id/stock-distribution`

**Example Request:**
```
GET /api/warehouses/abc123/stock-distribution
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "distribution": [
    {
      "type": "IN",
      "count": 150,
      "percentage": 75.0
    },
    {
      "type": "OUT",
      "count": 50,
      "percentage": 25.0
    }
  ]
}
```

**Frontend Usage (Chart.js Pie Chart):**
```javascript
const fetchStockDistribution = async (warehouseId) => {
  const response = await fetch(
    `http://localhost:3000/api/warehouses/${warehouseId}/stock-distribution`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  return {
    labels: data.distribution.map(d => `Stock ${d.type}`),
    datasets: [
      {
        data: data.distribution.map(d => d.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // Green for IN
          'rgba(239, 68, 68, 0.8)'   // Red for OUT
        ]
      }
    ]
  };
};
```

---

## 5. Weekly/Monthly Comparison (Comparison Chart)

**Endpoint:** `GET /api/warehouses/:id/comparison`

**Query Parameters:**
- `period` (optional): `week` | `month` (default: `month`)

**Example Request:**
```
GET /api/warehouses/abc123/comparison?period=month
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "current": {
    "period": "2024-03",
    "totalIn": 5000,
    "totalOut": 3200,
    "entries": 150
  },
  "previous": {
    "period": "2024-02",
    "totalIn": 4500,
    "totalOut": 3000,
    "entries": 120
  },
  "change": {
    "in": 11.1,
    "out": 6.7,
    "entries": 25.0
  }
}
```

**Frontend Usage (Comparison Bar Chart):**
```javascript
const fetchComparison = async (warehouseId, period = 'month') => {
  const response = await fetch(
    `http://localhost:3000/api/warehouses/${warehouseId}/comparison?period=${period}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  return {
    labels: ['Total IN', 'Total OUT', 'Entries'],
    datasets: [
      {
        label: data.previous.period,
        data: [
          data.previous.totalIn,
          data.previous.totalOut,
          data.previous.entries
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.8)'
      },
      {
        label: data.current.period,
        data: [
          data.current.totalIn,
          data.current.totalOut,
          data.current.entries
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };
};
```

---

## 6. Camera Status History (Optional)

**Endpoint:** `GET /api/warehouses/:id/camera-status-history`

**Query Parameters:**
- `days` (optional): Number of days (default: `7`)

**Example Request:**
```
GET /api/warehouses/abc123/camera-status-history?days=7
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "cameras": [
    {
      "cameraId": "uuid",
      "cameraName": "Main Entrance Camera",
      "currentStatus": "online",
      "lastUpdated": "2024-03-03T10:30:00.000Z"
    }
  ],
  "summary": {
    "total": 2,
    "online": 2,
    "offline": 0
  }
}
```

---

## 7. Inspector Activity (Optional)

**Endpoint:** `GET /api/warehouses/:id/inspector-activity`

**Example Request:**
```
GET /api/warehouses/abc123/inspector-activity
```

**Response:**
```json
{
  "warehouse": {
    "id": "abc123",
    "name": "Karachi Central Warehouse"
  },
  "inspectorActivity": [
    {
      "inspector": {
        "id": "uuid",
        "name": "John Inspector",
        "email": "inspector@warehouse.com"
      },
      "activity": {
        "totalEntries": 45,
        "entriesThisMonth": 20,
        "lastActivity": "2024-03-03T10:30:00.000Z"
      }
    }
  ]
}
```

---

## Complete Dashboard Data Fetching

**Fetch all chart data in parallel:**

```javascript
const fetchAllChartData = async (warehouseId) => {
  try {
    const [
      trendsRes,
      topItemsRes,
      timelineRes,
      distributionRes,
      comparisonRes
    ] = await Promise.all([
      fetch(`http://localhost:3000/api/warehouses/${warehouseId}/stock-trends?period=month`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`http://localhost:3000/api/warehouses/${warehouseId}/top-items?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`http://localhost:3000/api/warehouses/${warehouseId}/activity-timeline?days=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`http://localhost:3000/api/warehouses/${warehouseId}/stock-distribution`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`http://localhost:3000/api/warehouses/${warehouseId}/comparison?period=month`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const trends = await trendsRes.json();
    const topItems = await topItemsRes.json();
    const timeline = await timelineRes.json();
    const distribution = await distributionRes.json();
    const comparison = await comparisonRes.json();

    return {
      trends,
      topItems,
      timeline,
      distribution,
      comparison
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};
```

---

## Chart Library Recommendations

### Chart.js (Recommended)
```bash
npm install chart.js react-chartjs-2
```

**Example Component:**
```jsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function StockTrendsChart({ warehouseId }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchStockTrends(warehouseId).then(data => {
      setChartData(data);
    });
  }, [warehouseId]);

  if (!chartData) return <div>Loading chart...</div>;

  return (
    <Line 
      data={chartData}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Stock Trends Over Time' }
        }
      }}
    />
  );
}
```

### Recharts (Alternative)
```bash
npm install recharts
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Warehouse not found
- `500`: Internal server error

---

## Access Control

- **Super Admin:** Can access all warehouses
- **Permanent Secretary:** Can access all warehouses (read-only)
- **Inspector:** Can only access assigned warehouses

---

## Performance Notes

- All endpoints support efficient queries
- Consider caching chart data on frontend
- Use `Promise.all()` for parallel requests
- Implement loading states for better UX

---

## Testing

### Test All Endpoints:
```bash
# Stock Trends
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/warehouses/:id/stock-trends?period=month

# Top Items
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/warehouses/:id/top-items?limit=10

# Activity Timeline
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/warehouses/:id/activity-timeline?days=7

# Stock Distribution
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/warehouses/:id/stock-distribution

# Comparison
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/warehouses/:id/comparison?period=month
```

---

## Summary

All 7 chart endpoints are now available:

1. ✅ `GET /api/warehouses/:id/stock-trends` - Line/Area chart data
2. ✅ `GET /api/warehouses/:id/top-items` - Bar chart data
3. ✅ `GET /api/warehouses/:id/activity-timeline` - Timeline chart data
4. ✅ `GET /api/warehouses/:id/stock-distribution` - Pie/Doughnut chart data
5. ✅ `GET /api/warehouses/:id/comparison` - Comparison chart data
6. ✅ `GET /api/warehouses/:id/camera-status-history` - Camera status
7. ✅ `GET /api/warehouses/:id/inspector-activity` - Inspector activity

All endpoints are production-ready and follow the same authentication/authorization patterns as existing endpoints.
