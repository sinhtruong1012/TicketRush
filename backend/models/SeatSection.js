const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatSection = sequelize.define('SeatSection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'event_id',
    references: { model: 'events', key: 'id' },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  rowsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rows_count',
    validate: { min: 1, max: 50 },
  },
  seatsPerRow: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seats_per_row',
    validate: { min: 1, max: 50 },
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  colorCode: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#00D4FF',
    field: 'color_code',
  },
}, {
  tableName: 'seat_sections',
  underscored: true,
  timestamps: true,
});

module.exports = SeatSection;
