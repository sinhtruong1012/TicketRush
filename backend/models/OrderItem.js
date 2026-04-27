const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id',
    references: { model: 'orders', key: 'id' },
  },
  seatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seat_id',
    references: { model: 'seats', key: 'id' },
  },
  priceAtPurchase: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'price_at_purchase',
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code_data',
  },
}, {
  tableName: 'order_items',
  underscored: true,
  timestamps: true,
});

module.exports = OrderItem;
