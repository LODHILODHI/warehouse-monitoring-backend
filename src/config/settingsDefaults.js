/**
 * Default system settings (key -> value).
 * Used when no value is stored in DB. All values are strings.
 */
const DEFAULTS = {
  // General
  system_name: 'Warehouse Monitoring System',
  organization_name: 'Supply Department',
  support_email: '',
  support_phone: '',
  timezone: 'Asia/Karachi',
  language: 'en',
  logo_url: '',

  // Security
  two_fa_enabled: 'false',
  password_min_length: '8',
  login_attempt_limit: '5',
  session_timeout_minutes: '30',
  jwt_expiry_hours: '24',

  // Notifications
  email_notifications_enabled: 'false',
  sms_notifications_enabled: 'false',
  low_stock_threshold: '20',
  camera_offline_alert_minutes: '5',

  // Warehouse
  default_warehouse_capacity: '10000',
  allow_stock_transfer: 'true',
  inventory_alerts_enabled: 'true',
  camera_monitoring_enabled: 'true',

  // Users
  allow_self_password_reset: 'true',
  default_new_user_role: 'inspector',
  max_inspectors_per_warehouse: '10',

  // Map
  default_map_zoom: '10',
  map_low_stock_color: '#ef4444',
  map_normal_stock_color: '#22c55e',
  map_live_status_enabled: 'true',

  // Backup
  backup_enabled: 'false',
  backup_frequency: 'daily',
  backup_storage_location: 'local',

  // Reports
  default_report_format: 'pdf',
  csv_export_enabled: 'true',
  pdf_export_enabled: 'true',

  // Maintenance
  maintenance_mode: 'false',
  maintenance_message: 'System is under maintenance. Please try again later.',

  // Feature flags
  feature_cameras: 'true',
  feature_map: 'true',
  feature_reports: 'true',
  feature_stock_transfer: 'true'
};

const GROUPS = {
  general: [
    'system_name', 'organization_name', 'support_email', 'support_phone',
    'timezone', 'language', 'logo_url'
  ],
  security: [
    'two_fa_enabled', 'password_min_length', 'login_attempt_limit',
    'session_timeout_minutes', 'jwt_expiry_hours'
  ],
  notifications: [
    'email_notifications_enabled', 'sms_notifications_enabled',
    'low_stock_threshold', 'camera_offline_alert_minutes'
  ],
  warehouse: [
    'default_warehouse_capacity', 'allow_stock_transfer',
    'inventory_alerts_enabled', 'camera_monitoring_enabled'
  ],
  users: [
    'allow_self_password_reset', 'default_new_user_role',
    'max_inspectors_per_warehouse'
  ],
  map: [
    'default_map_zoom', 'map_low_stock_color', 'map_normal_stock_color',
    'map_live_status_enabled'
  ],
  backup: [
    'backup_enabled', 'backup_frequency', 'backup_storage_location'
  ],
  reports: [
    'default_report_format', 'csv_export_enabled', 'pdf_export_enabled'
  ],
  maintenance: [
    'maintenance_mode', 'maintenance_message'
  ],
  feature_flags: [
    'feature_cameras', 'feature_map', 'feature_reports', 'feature_stock_transfer'
  ]
};

module.exports = { DEFAULTS, GROUPS };
