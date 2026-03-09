const { User, InspectorWarehouse } = require('../models');
const { validatePassword } = require('../utils/passwordPolicy');
const { logAudit } = require('../utils/auditHelper');

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    if (role && !['super_admin', 'inspector', 'permanent_secretary'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be super_admin, inspector, or permanent_secretary' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password, // Will be hashed automatically by model hook
      role: role || 'inspector'
    });

    // Remove password from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    await logAudit(req, 'user_created', 'user', user.id, { email: user.email, role: user.role });

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      include: [
        {
          model: InspectorWarehouse,
          as: 'assignedWarehouses',
          required: false, // LEFT JOIN - include users even if no warehouses assigned
          include: [
            {
              model: require('../models').Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'address', 'status']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format response to include assigned warehouses count and names
    const formattedUsers = users.map(user => {
      const userJson = user.toJSON();
      const assignedWarehouses = userJson.assignedWarehouses || [];
      
      return {
        id: userJson.id,
        name: userJson.name,
        email: userJson.email,
        role: userJson.role,
        createdAt: userJson.createdAt,
        updatedAt: userJson.updatedAt,
        assignedWarehouses: assignedWarehouses.map(aw => ({
          id: aw.warehouse.id,
          name: aw.warehouse.name,
          address: aw.warehouse.address,
          status: aw.warehouse.status
        })),
        assignedWarehousesCount: assignedWarehouses.length
      };
    });

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      include: [
        {
          model: InspectorWarehouse,
          as: 'assignedWarehouses',
          include: [
            {
              model: require('../models').Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'address', 'status']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-role change for super_admin
    if (req.user.id === id && role && role !== user.role) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if email already exists (excluding current user)
      const { Op } = require('sequelize');
      const existingUser = await User.findOne({ 
        where: { email, id: { [Op.ne]: id } } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email;
    }
    if (password !== undefined) {
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.valid) {
        return res.status(400).json({ error: pwdCheck.error });
      }
      user.password = password; // Will be hashed automatically
    }
    if (role !== undefined) {
      if (!['super_admin', 'inspector', 'permanent_secretary'].includes(role)) {
        return res.status(400).json({ 
          error: 'Role must be super_admin, inspector, or permanent_secretary' 
        });
      }
      user.role = role;
    }

    await user.save();

    await logAudit(req, 'user_updated', 'user', user.id, { email: user.email, role: user.role });

    // Remove password from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedEmail = user.email;
    await user.destroy();

    await logAudit(req, 'user_deleted', 'user', id, { email: deletedEmail });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
