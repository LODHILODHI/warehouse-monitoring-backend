# Profile API – Frontend Integration

Brief reference for integrating **current user profile view** and **profile update** with the backend.

---

## Base

- **Base URL:** Same as existing API (e.g. `http://localhost:3000/api`)
- **Auth:** Send JWT in header: `Authorization: Bearer <token>`
- **Content-Type:** `application/json` for PATCH body

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/me` | Get logged-in user's profile |
| PATCH  | `/api/me` | Update logged-in user's profile (name, email, password) |

---

## 1. Get profile – `GET /api/me`

**Request**
```http
GET /api/me
Authorization: Bearer <your-jwt-token>
```

**Response (200)**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "inspector",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `401` if not authenticated or token invalid/expired.

---

## 2. Update profile – `PATCH /api/me`

**Request**  
Send only the fields you want to change. Omit unchanged fields.

```http
PATCH /api/me
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "newpassword123"
}
```

**Response (200)**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "inspector",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Errors**
- `400` – Validation (e.g. invalid email) or `"Email already in use"` if email is taken by another user.
- `401` – Not authenticated.

**Notes**
- **Role** cannot be updated via this endpoint (admin-only via `/api/users/:id`).
- **Password** is optional; if sent, it is hashed on the server. Omit when not changing password.

---

## Quick usage examples

**Fetch – get profile**
```javascript
const res = await fetch(`${API_BASE}/me`, {
  headers: { Authorization: `Bearer ${token}` }
});
const { user } = await res.json();
```

**Fetch – update profile**
```javascript
const res = await fetch(`${API_BASE}/me`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'New Name', email: 'new@example.com' })
});
const data = await res.json(); // { message, user }
```

**Axios**
```javascript
// Get profile
const { data } = await api.get('/me');

// Update profile (partial)
const { data } = await api.patch('/me', { name, email, password });
// data.user has updated profile; optionally refresh auth context/localStorage
```

---

## Suggested UI flow

1. **Profile page / modal**  
   - On load: `GET /api/me` and show name, email, role (read-only).  
   - Form: editable name, email, and optional “New password” (and confirm).

2. **On save**  
   - `PATCH /api/me` with only changed fields (omit password if left blank).  
   - On success: update local auth state / localStorage with `data.user` so header/sidebar show new name/email; show success message.

3. **Sidebar/header**  
   - Can keep using existing auth user from login; optionally refresh from `GET /api/me` when opening profile or on app load for latest name/email.

---

## Summary

- **View profile:** `GET /api/me` → use `response.user`.
- **Update profile:** `PATCH /api/me` with `{ name?, email?, password? }` → use `response.user` to refresh UI and auth state.
- Same token and base URL as rest of the app; no new env vars.
