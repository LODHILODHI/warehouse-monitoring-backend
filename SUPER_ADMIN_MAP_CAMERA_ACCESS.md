# Super Admin Map & Camera Streams Access - Frontend Guide

## Backend Status ✅

**Backend is already configured correctly!** Super admin has full access to:
- `GET /api/map/warehouses` - ✅ Accessible
- `GET /api/warehouses/:id/cameras` - ✅ Accessible

## Frontend Changes Required

You need to update your frontend navigation/routing to show Map and Camera Streams pages for **super_admin** role.

---

## 1. Navigation/Sidebar Update

### Show Map & Camera Streams for Super Admin

**Current Issue:** Navigation might be showing these links only for `permanent_secretary`.

**Fix:** Update navigation to show for both `super_admin` AND `permanent_secretary`.

### React Example:

```jsx
// In your Sidebar/Navigation component
import { useAuth } from './hooks/useAuth'; // or your auth context

function Sidebar() {
  const { user } = useAuth();
  
  // Check if user can access map and camera streams
  const canAccessMap = user?.role === 'super_admin' || user?.role === 'permanent_secretary';
  
  return (
    <nav>
      {/* Other navigation items */}
      
      {/* Show for super_admin and permanent_secretary */}
      {canAccessMap && (
        <>
          <NavLink to="/map">
            <MapIcon />
            Map View
          </NavLink>
          <NavLink to="/camera-streams">
            <CameraIcon />
            Camera Streams
          </NavLink>
        </>
      )}
    </nav>
  );
}
```

---

## 2. Route Protection Update

### Update Route Guards

**React Router Example:**

```jsx
// In your App.jsx or routes file
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Protected route for Map and Camera Streams
function MapCameraRoute({ children }) {
  const { user } = useAuth();
  
  // Allow super_admin and permanent_secretary
  const allowedRoles = ['super_admin', 'permanent_secretary'];
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// In your routes
<Route 
  path="/map" 
  element={
    <MapCameraRoute>
      <MapPage />
    </MapCameraRoute>
  } 
/>

<Route 
  path="/camera-streams" 
  element={
    <MapCameraRoute>
      <CameraStreamsPage />
    </MapCameraRoute>
  } 
/>
```

---

## 3. API Calls - Same for Both Roles

### Map Warehouses API

```javascript
// Works for both super_admin and permanent_secretary
const fetchMapWarehouses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/map/warehouses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    
    const data = await response.json();
    return data.warehouses;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};
```

### Warehouse Cameras API

```javascript
// Works for both super_admin and permanent_secretary
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
    
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cameras:', error);
    throw error;
  }
};
```

---

## 4. Role-Based UI Differences

### Super Admin vs Permanent Secretary

**Super Admin can:**
- ✅ View map
- ✅ View camera streams
- ✅ Create/edit/delete warehouses
- ✅ Create/edit/delete cameras
- ✅ Create/edit stock entries
- ✅ Manage users

**Permanent Secretary can:**
- ✅ View map
- ✅ View camera streams (read-only)
- ❌ Cannot create/edit/delete warehouses
- ❌ Cannot create/edit/delete cameras
- ❌ Cannot create/edit stock entries
- ❌ Cannot manage users

### UI Example - Conditional Buttons

```jsx
function MapPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  return (
    <div>
      <h1>Warehouse Map</h1>
      
      {/* Show create/edit buttons only for super_admin */}
      {isSuperAdmin && (
        <div className="actions">
          <button onClick={handleCreateWarehouse}>
            + Create Warehouse
          </button>
          <button onClick={handleEditWarehouse}>
            Edit Warehouse
          </button>
        </div>
      )}
      
      {/* Map component - same for both */}
      <WarehouseMap warehouses={warehouses} />
    </div>
  );
}
```

---

## 5. Complete Navigation Component Example

```jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function Navigation() {
  const { user } = useAuth();
  const location = useLocation();
  
  const isSuperAdmin = user?.role === 'super_admin';
  const isPermanentSecretary = user?.role === 'permanent_secretary';
  const isInspector = user?.role === 'inspector';
  const canAccessMap = isSuperAdmin || isPermanentSecretary;
  
  return (
    <nav className="sidebar">
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/warehouses">Warehouses</Link>
        
        {/* Show for all authenticated users */}
        <Link to="/stock">Stock Entries</Link>
        <Link to="/reports">Reports</Link>
        
        {/* Show Map and Camera Streams for super_admin and permanent_secretary */}
        {canAccessMap && (
          <>
            <Link to="/map">Map View</Link>
            <Link to="/camera-streams">Camera Streams</Link>
          </>
        )}
        
        {/* Show Users management only for super_admin */}
        {isSuperAdmin && (
          <Link to="/users">Users</Link>
        )}
      </div>
    </nav>
  );
}
```

---

## 6. Quick Fix Checklist

- [ ] Update navigation sidebar to show Map & Camera Streams for `super_admin`
- [ ] Update route guards to allow `super_admin` access
- [ ] Test with super_admin login: `admin@warehouse.com`
- [ ] Verify map page loads for super_admin
- [ ] Verify camera streams page loads for super_admin
- [ ] Test API calls work for super_admin

---

## 7. Testing

### Test as Super Admin:
1. Login: `admin@warehouse.com` / `admin123`
2. Check sidebar - should see "Map View" and "Camera Streams"
3. Navigate to `/map` - should load successfully
4. Navigate to `/camera-streams` - should load successfully
5. Click warehouse pins - should fetch cameras
6. Camera streams should display

### Test as Permanent Secretary:
1. Login: `secretary@warehouse.com` / `secretary123`
2. Check sidebar - should see "Map View" and "Camera Streams"
3. Navigate to `/map` - should load successfully
4. Navigate to `/camera-streams` - should load successfully
5. Should NOT see create/edit buttons

---

## Summary

**Backend:** ✅ Already configured correctly - no changes needed

**Frontend:** Update navigation and route guards to show Map & Camera Streams for:
- `super_admin` ✅
- `permanent_secretary` ✅

Both roles can access the same APIs, but super_admin has additional privileges (create/edit/delete) that permanent_secretary doesn't have.
