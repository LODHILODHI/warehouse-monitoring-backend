const { getSettingsForApi, updateSettings, getSettingsMap } = require('../services/settings.service');
const { logAudit } = require('../utils/auditHelper');

const PUBLIC_KEYS = [
  'maintenance_mode', 'maintenance_message', 'system_name', 'organization_name', 'logo_url',
  'feature_cameras', 'feature_map', 'feature_reports', 'feature_stock_transfer'
];

/**
 * GET /api/settings/public - no auth; for login page and app shell (system name, maintenance, feature flags)
 */
const getPublicSettings = async (req, res) => {
  try {
    const all = await getSettingsMap();
    const public_ = {};
    PUBLIC_KEYS.forEach(k => { if (all[k] !== undefined) public_[k] = all[k]; });
    res.json(public_);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/settings
 * Query: group (optional) - general | security | notifications | warehouse | users | map | backup | reports | maintenance | feature_flags
 */
const getSettings = async (req, res) => {
  try {
    const { group } = req.query;
    const data = await getSettingsForApi(group || null);
    res.json(data);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/admin/settings
 * Body: { settings: { key: value, ... } }
 */
const updateSettingsHandler = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Body must include "settings" object with key-value pairs' });
    }

    await updateSettings(settings);
    await logAudit(req, 'settings_updated', 'system_settings', null, { keys: Object.keys(settings) });

    const data = await getSettingsForApi();
    res.json({
      message: 'Settings updated successfully',
      ...data
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getPublicSettings, getSettings, updateSettingsHandler };
