const { Warehouse } = require('../models');

/**
 * Get all warehouses for map display
 * Returns only id, name, latitude, longitude
 * Accessible by: super_admin, permanent_secretary
 */
const getMapWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      attributes: ['id', 'name', 'latitude', 'longitude'],
      where: {
        status: 'active' // Only show active warehouses on map
      },
      order: [['name', 'ASC']]
    });

    res.json({
      warehouses: warehouses.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        latitude: parseFloat(warehouse.latitude),
        longitude: parseFloat(warehouse.longitude)
      }))
    });
  } catch (error) {
    console.error('Get map warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMapWarehouses
};
