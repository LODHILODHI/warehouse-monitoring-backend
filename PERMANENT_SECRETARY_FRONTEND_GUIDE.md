# Permanent Secretary Frontend Integration Guide

This guide provides all the information needed to integrate the Permanent Secretary role features into your frontend application.

## Overview

The Permanent Secretary role has **read-only access** to:
- View all warehouses on a map
- View warehouse details
- View camera streams (read-only)
- View dashboard statistics
- View reports

**Restrictions:**
- Cannot create/edit/delete warehouses
- Cannot create/edit stock entries
- Cannot assign inspectors
- Cannot manage cameras (create/edit/delete)

---

## Authentication

### Login Endpoint
Same as other users:

```javascript
POST /api/login
Content-Type: application/json

{
  "email": "secretary@warehouse.com",
  "password": "secretary123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Permanent Secretary",
    "email": "secretary@warehouse.com",
    "role": "permanent_secretary"
  }
}
```

---

## API Endpoints for Permanent Secretary

### 1. Get Warehouses for Map Display

**Endpoint:** `GET /api/map/warehouses`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "warehouses": [
    {
      "id": "uuid",
      "name": "Karachi Central Warehouse",
      "latitude": 24.8607,
      "longitude": 67.0011
    },
    {
      "id": "uuid",
      "name": "Lahore North Warehouse",
      "latitude": 31.5204,
      "longitude": 74.3587
    }
  ]
}
```

**Frontend Implementation (React Example):**
```javascript
// Fetch warehouses for map
const fetchMapWarehouses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/map/warehouses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.warehouses;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};
```

---

### 2. Get Warehouse Cameras

**Endpoint:** `GET /api/warehouses/:id/cameras`

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
  "cameras": [
    {
      "id": "uuid",
      "name": "Main Entrance Camera",
      "streamUrl": "rtsp://example.com/stream1",
      "status": "online"
    },
    {
      "id": "uuid",
      "name": "Loading Bay Camera",
      "streamUrl": "rtsp://example.com/stream2",
      "status": "offline"
    }
  ]
}
```

**Frontend Implementation (React Example):**
```javascript
// Fetch cameras for a warehouse
const fetchWarehouseCameras = async (warehouseId) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/warehouses/${warehouseId}/cameras`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cameras:', error);
    throw error;
  }
};
```

---

### 3. Get Warehouse Details

**Endpoint:** `GET /api/warehouses/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "warehouse": {
    "id": "uuid",
    "name": "Karachi Central Warehouse",
    "latitude": "24.8607",
    "longitude": "67.0011",
    "address": "Industrial Area, SITE, Karachi, Sindh 75700",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "cameras": [
      {
        "id": "uuid",
        "name": "Main Entrance Camera",
        "streamUrl": "rtsp://example.com/stream1",
        "status": "online"
      }
    ]
  }
}
```

---

### 4. Dashboard Statistics

**Endpoint:** `GET /api/dashboard/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "metrics": {
    "totalWarehouses": 12,
    "activeWarehouses": 12,
    "stockEntriesToday": 45,
    "stockEntriesThisMonth": 1200,
    "stockEntriesLastMonth": 1100,
    "monthChange": 9.1,
    "totalCameras": 36,
    "onlineCameras": 32
  },
  "recentStockEntries": [...],
  "stockByType": {
    "in": 650,
    "out": 550
  }
}
```

---

## Frontend Implementation Guide

### 1. Map Integration (Leaflet.js)

**Install Leaflet:**
```bash
npm install leaflet react-leaflet
```

**Map Component Example:**
```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function WarehouseMap({ warehouses, onWarehouseClick }) {
  // Center map on Pakistan
  const center = [30.3753, 69.3451]; // Pakistan center coordinates
  
  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {warehouses.map((warehouse) => (
        <Marker
          key={warehouse.id}
          position={[warehouse.latitude, warehouse.longitude]}
          eventHandlers={{
            click: () => onWarehouseClick(warehouse.id)
          }}
        >
          <Popup>
            <div>
              <h3>{warehouse.name}</h3>
              <button onClick={() => onWarehouseClick(warehouse.id)}>
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

### 2. Camera Grid Component

**Camera Grid Example:**
```jsx
function CameraGrid({ cameras }) {
  return (
    <div className="camera-grid">
      <h2>Live Camera Streams</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <div key={camera.id} className="camera-card">
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
                className="w-full h-48 bg-gray-900"
                autoPlay
                muted
              />
            ) : (
              <div className="offline-placeholder">
                <p>Camera Offline</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Complete Dashboard Component

**Full Dashboard Example:**
```jsx
import { useState, useEffect } from 'react';
import WarehouseMap from './WarehouseMap';
import CameraGrid from './CameraGrid';

function PermanentSecretaryDashboard() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMapWarehouses();
  }, []);

  const fetchMapWarehouses = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/map/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setWarehouses(data.warehouses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setLoading(false);
    }
  };

  const handleWarehouseClick = async (warehouseId) => {
    try {
      // Fetch warehouse details
      const warehouseResponse = await fetch(
        `http://localhost:3000/api/warehouses/${warehouseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const warehouseData = await warehouseResponse.json();

      // Fetch cameras
      const camerasResponse = await fetch(
        `http://localhost:3000/api/warehouses/${warehouseId}/cameras`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const camerasData = await camerasResponse.json();

      setSelectedWarehouse(warehouseData.warehouse);
      setCameras(camerasData.cameras);
    } catch (error) {
      console.error('Error fetching warehouse details:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="map-section">
        <WarehouseMap
          warehouses={warehouses}
          onWarehouseClick={handleWarehouseClick}
        />
      </div>

      {selectedWarehouse && (
        <div className="warehouse-details-panel">
          <div className="warehouse-info">
            <h2>{selectedWarehouse.name}</h2>
            <p>{selectedWarehouse.address}</p>
            <p>Status: {selectedWarehouse.status}</p>
          </div>

          <CameraGrid cameras={cameras} />
        </div>
      )}
    </div>
  );
}

export default PermanentSecretaryDashboard;
```

---

## Error Handling

### 403 Forbidden Errors

If a permanent_secretary tries to perform a restricted action:

```json
{
  "error": "Access denied. Permanent secretary does not have permission for this action."
}
```

**Frontend Handling:**
```javascript
try {
  const response = await fetch(url, options);
  if (response.status === 403) {
    const error = await response.json();
    // Show user-friendly message
    alert(error.error);
    return;
  }
  // Handle success
} catch (error) {
  console.error('Error:', error);
}
```

---

## Role-Based UI Rendering

**Check User Role:**
```javascript
const user = JSON.parse(localStorage.getItem('user'));

if (user.role === 'permanent_secretary') {
  // Hide create/edit buttons
  // Show read-only interface
  // Display map view
}
```

**Conditional Rendering Example:**
```jsx
{user.role === 'permanent_secretary' && (
  <WarehouseMap warehouses={warehouses} />
)}

{user.role !== 'permanent_secretary' && (
  <button onClick={handleCreateWarehouse}>
    Create Warehouse
  </button>
)}
```

---

## API Response Structure Summary

### Map Warehouses Response
```typescript
interface MapWarehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapWarehousesResponse {
  warehouses: MapWarehouse[];
}
```

### Warehouse Cameras Response
```typescript
interface Camera {
  id: string;
  name: string;
  streamUrl: string;
  status: 'online' | 'offline';
}

interface WarehouseCamerasResponse {
  warehouse: {
    id: string;
    name: string;
  };
  cameras: Camera[];
}
```

---

## Testing

### Test Credentials
```
Email: secretary@warehouse.com
Password: secretary123
```

### Test Flow
1. Login as permanent_secretary
2. Fetch warehouses: `GET /api/map/warehouses`
3. Click on a warehouse pin
4. Fetch warehouse details: `GET /api/warehouses/:id`
5. Fetch cameras: `GET /api/warehouses/:id/cameras`
6. Display camera streams

### Expected Behavior
- ✅ Can view all warehouses on map
- ✅ Can view warehouse details
- ✅ Can view camera streams
- ✅ Can view dashboard stats
- ❌ Cannot create/edit warehouses (403 error)
- ❌ Cannot create/edit stock entries (403 error)

---

## Notes

1. **Map Library:** Use Leaflet.js or Google Maps for map integration
2. **Camera Streams:** Camera streams may use RTSP, HLS, or other protocols. Frontend needs appropriate video player
3. **Real-time Updates:** Consider WebSocket or polling for real-time camera status updates
4. **Performance:** For 150+ warehouses, implement pagination or clustering on the map
5. **Security:** Always include JWT token in Authorization header

---

## Support

For backend API issues, check:
- Server logs
- Network tab in browser DevTools
- API response status codes

For frontend integration help, refer to:
- React Leaflet documentation: https://react-leaflet.js.org/
- Leaflet.js documentation: https://leafletjs.com/
