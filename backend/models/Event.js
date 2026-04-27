const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'music',
  },
  venueName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'venue_name',
  },
  venueAddress: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'venue_address',
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'event_date',
  },
  saleStartAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sale_start_at',
  },
  posterUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'poster_url',
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'ended'),
    defaultValue: 'draft',
    allowNull: false,
  },
}, {
  tableName: 'events',
  underscored: true,
  timestamps: true,
});

module.exports = Event;
