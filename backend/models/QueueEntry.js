const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QueueEntry = sequelize.define('QueueEntry', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'access_token',
  },
  status: {
    type: DataTypes.ENUM('waiting', 'admitted', 'expired'),
    defaultValue: 'waiting',
    allowNull: false,
  },
  admittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'admitted_at',
  },
}, {
  tableName: 'queue_entries',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['event_id', 'status'] },
    { fields: ['user_id', 'event_id'] },
  ],
});

module.exports = QueueEntry;
