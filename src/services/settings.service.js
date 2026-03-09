const { SystemSetting } = require('../models');
const { DEFAULTS, GROUPS } = require('../config/settingsDefaults');

let cache = null;

/**
 * Get all settings as key-value map (DB values merged with defaults).
 * Optional group filter: 'general' | 'security' | 'notifications' | etc.
 */
async function getSettingsMap(group = null) {
  const rows = await SystemSetting.findAll({ attributes: ['key', 'value'] });
  const dbMap = {};
  rows.forEach(r => { dbMap[r.key] = r.value; });

  const keys = group && GROUPS[group] ? GROUPS[group] : Object.keys(DEFAULTS);
  const result = {};
  keys.forEach(key => {
    result[key] = dbMap[key] !== undefined && dbMap[key] !== null ? dbMap[key] : DEFAULTS[key];
  });
  return result;
}

/**
 * Get single setting value (string). Returns default if not set.
 */
async function getSetting(key) {
  const map = await getSettingsMap();
  return map[key] !== undefined ? map[key] : DEFAULTS[key];
}

/**
 * Update multiple settings. settings = { key: value, ... }
 */
async function updateSettings(settings) {
  const allowedKeys = new Set(Object.keys(DEFAULTS));
  for (const [key, value] of Object.entries(settings)) {
    if (!allowedKeys.has(key)) continue;
    const strVal = value === null || value === undefined ? '' : String(value);
    await SystemSetting.upsert({ key, value: strVal }, { conflictFields: ['key'] });
  }
  cache = null;
}

/**
 * Get settings for API response (optionally by group). Returns { settings: {}, groups: {} }
 */
async function getSettingsForApi(group = null) {
  const settings = await getSettingsMap(group);
  const groups = {};
  if (!group) {
    for (const [g, keys] of Object.entries(GROUPS)) {
      groups[g] = {};
      keys.forEach(k => {
        groups[g][k] = settings[k] !== undefined ? settings[k] : DEFAULTS[k];
      });
    }
  }
  return group ? { settings } : { settings, groups };
}

module.exports = {
  getSettingsMap,
  getSetting,
  updateSettings,
  getSettingsForApi,
  DEFAULTS,
  GROUPS
};
