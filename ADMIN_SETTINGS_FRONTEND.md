# Admin System Settings – Frontend Integration

Super_admin only. Base URL and auth same as rest of API: `Authorization: Bearer <token>`.

---

## 1. Public settings (no auth)

Use for login page and app shell: system name, maintenance message, feature flags.

**Endpoint:** `GET /api/settings/public`

**Response (200):**
```json
{
  "maintenance_mode": "false",
  "maintenance_message": "System is under maintenance. Please try again later.",
  "system_name": "Warehouse Monitoring System",
  "organization_name": "Supply Department",
  "logo_url": "",
  "feature_cameras": "true",
  "feature_map": "true",
  "feature_reports": "true",
  "feature_stock_transfer": "true"
}
```

**Frontend:**
- On app load (or login page), call this once. If `maintenance_mode === 'true'`, show a full-screen message using `maintenance_message` and optional `system_name` / `organization_name`. Hide main app.
- Use `system_name` / `organization_name` / `logo_url` in header or branding.
- Use `feature_*` to show/hide menu items or routes (e.g. hide "Map" if `feature_map === 'false'`).

---

## 2. Get all settings (super_admin)

**Endpoint:** `GET /api/admin/settings`  
**Query (optional):** `group` – return only one group.

**Query values for `group`:**  
`general` | `security` | `notifications` | `warehouse` | `users` | `map` | `backup` | `reports` | `maintenance` | `feature_flags`

**Response (200) – without group:**
```json
{
  "settings": {
    "system_name": "Warehouse Monitoring System",
    "organization_name": "Supply Department",
    "support_email": "",
    "support_phone": "",
    "timezone": "Asia/Karachi",
    "language": "en",
    "logo_url": "",
    "password_min_length": "8",
    "login_attempt_limit": "5",
    "maintenance_mode": "false",
    "maintenance_message": "System is under maintenance. Please try again later.",
    "feature_cameras": "true",
    "...": "..."
  },
  "groups": {
    "general": { "system_name": "...", "organization_name": "...", "..." },
    "security": { "two_fa_enabled": "false", "password_min_length": "8", "..." },
    "notifications": { "..." },
    "warehouse": { "..." },
    "users": { "..." },
    "map": { "..." },
    "backup": { "..." },
    "reports": { "..." },
    "maintenance": { "maintenance_mode": "false", "maintenance_message": "..." },
    "feature_flags": { "feature_cameras": "true", "..." }
  }
}
```

**Response (200) – with `?group=maintenance`:**
```json
{
  "settings": {
    "maintenance_mode": "false",
    "maintenance_message": "System is under maintenance. Please try again later."
  }
}
```

**Frontend:** Build Admin Settings UI with tabs/sections per group. Use `groups` to render each section.

---

## 3. Update settings (super_admin)

**Endpoint:** `PUT /api/admin/settings`  
**Body:**
```json
{
  "settings": {
    "system_name": "My Warehouse System",
    "maintenance_mode": "true",
    "maintenance_message": "Back in 1 hour.",
    "login_attempt_limit": "5",
    "feature_map": "true"
  }
}
```

- Send only keys you want to update. All values are **strings** (e.g. `"true"` / `"false"`, `"10"` for numbers).
- Unknown keys are ignored.

**Response (200):**
```json
{
  "message": "Settings updated successfully",
  "settings": { /* full flat settings */ },
  "groups": { /* same as GET */ }
}
```

**Errors:** `400` if body is missing or `settings` is not an object. `401`/`403` if not authenticated or not super_admin.

---

## 4. Settings keys by group (reference)

| Group | Keys | Example values |
|-------|------|----------------|
| **general** | system_name, organization_name, support_email, support_phone, timezone, language, logo_url | "Asia/Karachi", "en" |
| **security** | two_fa_enabled, password_min_length, login_attempt_limit, session_timeout_minutes, jwt_expiry_hours | "false", "8", "5", "30", "24" |
| **notifications** | email_notifications_enabled, sms_notifications_enabled, low_stock_threshold, camera_offline_alert_minutes | "false", "20", "5" |
| **warehouse** | default_warehouse_capacity, allow_stock_transfer, inventory_alerts_enabled, camera_monitoring_enabled | "10000", "true", "true", "true" |
| **users** | allow_self_password_reset, default_new_user_role, max_inspectors_per_warehouse | "true", "inspector", "10" |
| **map** | default_map_zoom, map_low_stock_color, map_normal_stock_color, map_live_status_enabled | "10", "#ef4444", "#22c55e", "true" |
| **backup** | backup_enabled, backup_frequency, backup_storage_location | "false", "daily", "local" |
| **reports** | default_report_format, csv_export_enabled, pdf_export_enabled | "pdf", "true", "true" |
| **maintenance** | maintenance_mode, maintenance_message | "false", "System under maintenance..." |
| **feature_flags** | feature_cameras, feature_map, feature_reports, feature_stock_transfer | "true" / "false" |

---

## 5. Maintenance mode behavior

- When `maintenance_mode` is `"true"`:
  - All API requests (except login, admin settings, and public settings) return **503** with `{ error: "Maintenance mode", message: "<maintenance_message>" }` for non–super_admin users.
  - Super_admin can still use the app and turn off maintenance from Admin Settings.
- Frontend: use `GET /api/settings/public` to read `maintenance_mode` and `maintenance_message` and show a maintenance screen without calling other APIs.

---

## 6. Suggested UI structure (Admin Settings)

- **Route (e.g. SPA):** `/admin/settings` – render only for `role === 'super_admin'`.
- **Sections/tabs:** General | Security | Notifications | Warehouse | Users | Map | Backup | Reports | Maintenance | Feature flags.
- **General:** System name, Organization, Support email/phone, Timezone, Language, Logo URL.
- **Security:** 2FA toggle, Password min length, Login attempt limit, Session timeout, JWT expiry.
- **Notifications:** Email/SMS toggles, Low stock threshold, Camera offline alert (minutes).
- **Warehouse:** Default capacity, Allow stock transfer, Inventory/Camera toggles.
- **Users:** Self password reset, Default new user role, Max inspectors per warehouse.
- **Map:** Default zoom, Low/Normal stock colors, Live status toggle.
- **Backup:** Enabled, Frequency, Storage location.
- **Reports:** Default format, CSV/PDF export toggles.
- **Maintenance:** Maintenance mode ON/OFF, Message text.
- **Feature flags:** Toggles for Cameras, Map, Reports, Stock transfer.

Use `GET /api/admin/settings` to load, `PUT /api/admin/settings` with `{ settings: { key: value, ... } }` to save. All values as strings.
