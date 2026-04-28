const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'event_id',
    references: { model: 'events', key: 'id' },
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_amount',
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_data',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },
}, {
  tableName: 'orders',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['user_id', 'status'] },
    { fields: ['status', 'expires_at'] },
  ],
});

module.exports = Order;
