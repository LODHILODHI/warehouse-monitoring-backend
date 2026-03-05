const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Camera extends Model {}

Camera.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    warehouseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    streamUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline'
    }
  },
  {
    sequelize,
    modelName: 'Camera',
    tableName: 'cameras',
    timestamps: true
  }
);

module.exports = Camera;
