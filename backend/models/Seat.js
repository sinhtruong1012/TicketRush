const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'section_id',
    references: { model: 'seat_sections', key: 'id' },
  },
  rowLabel: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'row_label',
  },
  seatNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seat_number',
  },
  status: {
    type: DataTypes.ENUM('available', 'locked', 'sold'),
    defaultValue: 'available',
    allowNull: false,
  },
  lockedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'locked_by',
    references: { model: 'users', key: 'id' },
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_at',
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  tableName: 'seats',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['section_id', 'status'] },
    { fields: ['locked_by'] },
    { fields: ['status', 'locked_at'] },
  ],
});

module.exports = Seat;
