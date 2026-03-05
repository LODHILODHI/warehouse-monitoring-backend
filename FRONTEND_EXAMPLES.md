# React Frontend Code Examples

## 1. API Service Setup

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2. Auth Service

```javascript
// src/services/auth.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },
};
```

---

## 3. Warehouse Service

```javascript
// src/services/warehouse.js
import api from './api';

export const warehouseService = {
  getAll: async () => {
    const response = await api.get('/warehouses');
    return response.data.warehouses;
  },

  create: async (warehouseData) => {
    const response = await api.post('/warehouses', warehouseData);
    return response.data;
  },
};
```

---

## 4. Stock Service

```javascript
// src/services/stock.js
import api from './api';

export const stockService = {
  getByWarehouse: async (warehouseId) => {
    const response = await api.get(`/stock/${warehouseId}`);
    return response.data;
  },

  create: async (stockData) => {
    const response = await api.post('/stock', stockData);
    return response.data;
  },
};
```

---

## 5. Auth Context

```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isSuperAdmin = () => user?.role === 'super_admin';
  const isInspector = () => user?.role === 'inspector';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isSuperAdmin,
        isInspector,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 6. Login Component

```javascript
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Warehouse Monitoring</h2>
          <p className="mt-2 text-center text-gray-600">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

---

## 7. Dashboard Component

```javascript
// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { warehouseService } from '../services/warehouse';
import { stockService } from '../services/stock';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [recentStockEntries, setRecentStockEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalWarehouses: 0,
    activeWarehouses: 0,
    stockEntriesToday: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const warehousesData = await warehouseService.getAll();
      setWarehouses(warehousesData);

      // Calculate metrics
      const activeWarehouses = warehousesData.filter((w) => w.status === 'active').length;
      setMetrics({
        totalWarehouses: warehousesData.length,
        activeWarehouses,
        stockEntriesToday: 0, // You can calculate this from stock entries
      });

      // Load recent stock entries from first warehouse
      if (warehousesData.length > 0) {
        const stockData = await stockService.getByWarehouse(warehousesData[0].id);
        setRecentStockEntries(stockData.stockEntries.slice(0, 5));
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Warehouses</h3>
          <p className="text-3xl font-bold mt-2">{metrics.totalWarehouses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Warehouses</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{metrics.activeWarehouses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Stock Entries Today</h3>
          <p className="text-3xl font-bold mt-2">{metrics.stockEntriesToday}</p>
        </div>
      </div>

      {/* Recent Stock Entries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Stock Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentStockEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{entry.itemName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.type === 'IN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.inspector?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 8. Protected Route Component

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## 9. App Router Setup

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Warehouses from './pages/Warehouses';
import StockEntries from './pages/StockEntries';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Header />
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Header />
                <Warehouses />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Header />
                <StockEntries />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 10. Create Stock Entry Form

```javascript
// src/components/stock/CreateStockEntryForm.jsx
import { useState, useEffect } from 'react';
import { stockService } from '../../services/stock';
import { warehouseService } from '../../services/warehouse';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CreateStockEntryForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    warehouseId: '',
    type: 'IN',
    itemName: '',
    quantity: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getAll();
      // If inspector, filter only assigned warehouses
      // You might need to get assigned warehouses from a separate endpoint
      setWarehouses(data);
    } catch (error) {
      toast.error('Failed to load warehouses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await stockService.create({
        ...formData,
        quantity: parseInt(formData.quantity),
      });
      toast.success('Stock entry created successfully!');
      setFormData({
        warehouseId: '',
        type: 'IN',
        itemName: '',
        quantity: '',
        notes: '',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create stock entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Warehouse</label>
        <select
          required
          value={formData.warehouseId}
          onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="IN"
              checked={formData.type === 'IN'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mr-2"
            />
            IN
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="OUT"
              checked={formData.type === 'OUT'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mr-2"
            />
            OUT
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Item Name</label>
        <input
          type="text"
          required
          value={formData.itemName}
          onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity</label>
        <input
          type="number"
          required
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="3"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Stock Entry'}
      </button>
    </form>
  );
};

export default CreateStockEntryForm;
```

---

## Package.json for React Project

```json
{
  "name": "warehouse-monitoring-frontend",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "react-hot-toast": "^2.4.0",
    "date-fns": "^2.29.3",
    "recharts": "^2.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21"
  }
}
```
