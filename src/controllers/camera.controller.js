const { Camera, Warehouse } = require('../models');
const { logAudit } = require('../utils/auditHelper');

const createCamera = async (req, res) => {
  try {
    const { warehouseId, name, streamUrl, status } = req.body;

    if (!warehouseId || !name || !streamUrl) {
      return res.status(400).json({ 
        error: 'Warehouse ID, name, and stream URL are required' 
      });
    }

    // Verify warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const camera = await Camera.create({
      warehouseId,
      name,
      streamUrl,
      status: status || 'offline'
    });

    await logAudit(req, 'camera_created', 'camera', camera.id, { name: camera.name, warehouseId });

    res.status(201).json({
      message: 'Camera created successfully',
      camera
    });
  } catch (error) {
    console.error('Create camera error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCameras = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const whereClause = warehouseId ? { warehouseId } : {};

    const cameras = await Camera.findAll({
      where: whereClause,
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ cameras });
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCameraById = async (req, res) => {
  try {
    const { id } = req.params;

    const camera = await Camera.findByPk(id, {
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'address']
        }
      ]
    });

    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.json({ camera });
  } catch (error) {
    console.error('Get camera error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, streamUrl, status } = req.body;

    const camera = await Camera.findByPk(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Update only provided fields
    if (name !== undefined) camera.name = name;
    if (streamUrl !== undefined) camera.streamUrl = streamUrl;
    if (status !== undefined) {
      if (!['online', 'offline'].includes(status)) {
        return res.status(400).json({ error: 'Status must be online or offline' });
      }
      camera.status = status;
    }

    await camera.save();

    await logAudit(req, 'camera_updated', 'camera', camera.id, { name: camera.name, status: camera.status });

    res.json({
      message: 'Camera updated successfully',
      camera
    });
  } catch (error) {
    console.error('Update camera error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;

    const camera = await Camera.findByPk(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    const cameraName = camera.name;
    const whId = camera.warehouseId;
    await camera.destroy();

    await logAudit(req, 'camera_deleted', 'camera', id, { name: cameraName, warehouseId: whId });

    res.json({
      message: 'Camera deleted successfully'
    });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createCamera,
  getCameras,
  getCameraById,
  updateCamera,
  deleteCamera
};
