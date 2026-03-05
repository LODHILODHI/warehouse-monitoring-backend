const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class InspectorWarehouse extends Model {}

InspectorWarehouse.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    warehouseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    modelName: 'InspectorWarehouse',
    tableName: 'inspector_warehouses',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'warehouseId']
      }
    ]
  }
);

module.exports = InspectorWarehouse;
