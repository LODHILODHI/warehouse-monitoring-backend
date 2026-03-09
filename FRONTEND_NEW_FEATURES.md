# New Features – Frontend Integration (Brief)

Quick reference to integrate the recently added backend features. Base URL and auth same as existing API (`Authorization: Bearer <token>`).

---

## 1. Login – Rate limiting

**Behaviour:** Max **5 login attempts per minute** per client. After that, backend returns **429**.

**Frontend:**
- On **429** response: show message like *"Too many attempts. Try again in a minute."*
- Optionally disable login button for 60 seconds after 429.

**Response (429):**
```json
{ "error": "Too many login attempts. Try again in a minute." }
```

---

## 2. Password policy (create user / update profile / update user)

**Rules (enforce in UI + show backend errors):**
- Min **8 characters**
- At least **1 uppercase**
- At least **1 number**
- At least **1 special character** (e.g. `!@#$%^&*`)

**Where it applies:**
- **PATCH /api/me** – password change
- **POST /api/users** – new user password
- **PUT/PATCH /api/users/:id** – user update when password is sent

**Backend error (400):** One of:
- `"Password must be at least 8 characters"`
- `"Password must contain at least one uppercase letter"`
- `"Password must contain at least one number"`
- `"Password must contain at least one special character (!@#$%^&* etc.)"`

**Frontend:** Validate before submit; show same messages on 400.

---

## 3. Warehouse capacity

**Model:** Each warehouse can have optional **capacity** (integer).

**Create warehouse – POST /api/warehouses**
- Body can include: `capacity` (number, optional).

**Update warehouse – PUT/PATCH /api/warehouses/:id**
- Body can include: `capacity` (number or `null` to clear).

**Get warehouses – GET /api/warehouses** and **GET /api/warehouses/:id**
- Response includes `capacity` (number or `null`).

**Frontend:** Add optional "Capacity" field in warehouse form; show in list/detail. Use for % full or alerts if you compute current stock.

---

## 4. Stock transfer

**Endpoint:** `POST /api/stock/transfer`  
**Auth:** Same as other APIs. **Roles:** super_admin, or inspector (must be assigned to **both** warehouses).

**Request body:**
```json
{
  "fromWarehouseId": "uuid",
  "toWarehouseId": "uuid",
  "itemName": "string",
  "quantity": 1,
  "notes": "optional"
}
```

**Response (201):**
```json
{
  "message": "Stock transfer completed successfully",
  "transfer": {
    "out": { /* StockEntry (OUT at source) */ },
    "in":  { /* StockEntry (IN at destination) */ }
  }
}
```

**Errors:**
- **400** – missing field, same warehouse, or quantity &lt; 1
- **403** – inspector not assigned to one or both warehouses
- **404** – warehouse not found

**Frontend:** Transfer form: dropdowns for From warehouse + To warehouse, item name, quantity, optional notes. Call this API; show success or error message.

---

## 5. Login logs (super_admin only)

**Endpoint:** `GET /api/security/login-logs`

**Query (optional):**
- `userId` – filter by user
- `limit` – default 50, max 200
- `from`, `to` – ISO date strings for range

**Example:** `GET /api/security/login-logs?limit=20&from=2024-01-01&to=2024-12-31`

**Response (200):**
```json
{
  "loginLogs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "ipAddress": "127.0.0.1",
      "userAgent": "...",
      "loginAt": "2024-01-15T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Admin",
        "email": "admin@example.com",
        "role": "super_admin"
      }
    }
  ]
}
```

**Frontend:** Security/Admin page; table with columns: User, Email, IP, User-Agent, Login time. Show only for `role === 'super_admin'`.

---

## 6. Audit logs (super_admin only)

**Endpoint:** `GET /api/audit-logs`

**Query (optional):**
- `action` – e.g. `warehouse_created`, `user_deleted`, `stock_entry_created`
- `entityType` – e.g. `warehouse`, `user`, `stock_entry`, `camera`
- `entityId` – UUID of entity
- `userId` – who did the action
- `limit` – default 50, max 200
- `from`, `to` – ISO date range

**Example:** `GET /api/audit-logs?entityType=warehouse&limit=30`

**Response (200):**
```json
{
  "auditLogs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "warehouse_created",
      "entityType": "warehouse",
      "entityId": "uuid",
      "details": "{\"name\":\"Warehouse A\"}",
      "ipAddress": "127.0.0.1",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Admin",
        "email": "admin@example.com",
        "role": "super_admin"
      }
    }
  ]
}
```

**Frontend:** Audit/Activity page; table: Who, Action, Entity type, Entity ID, Details (parse JSON if needed), IP, Time. Show only for super_admin.

---

## Summary table

| Feature           | Endpoint / place              | Role / note                    |
|------------------|-------------------------------|--------------------------------|
| Rate limit       | POST /api/login               | Handle 429                     |
| Password policy  | PATCH /api/me, POST/PUT /api/users | Validate in UI + 400 errors |
| Warehouse capacity | GET/POST/PUT/PATCH /api/warehouses | Optional field `capacity`  |
| Stock transfer   | POST /api/stock/transfer       | super_admin or inspector (both WH) |
| Login logs       | GET /api/security/login-logs  | super_admin only               |
| Audit logs       | GET /api/audit-logs           | super_admin only               |

Use this with your existing auth and API client to wire forms, tables, and error messages.
