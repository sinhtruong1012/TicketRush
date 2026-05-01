const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const SeatSection = require('./SeatSection');
const Seat = require('./Seat');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const QueueEntry = require('./QueueEntry');

// Associations
Event.hasMany(SeatSection, { foreignKey: 'event_id', as: 'sections' });
SeatSection.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

SeatSection.hasMany(Seat, { foreignKey: 'section_id', as: 'seats' });
Seat.belongsTo(SeatSection, { foreignKey: 'section_id', as: 'section' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Event.hasMany(Order, { foreignKey: 'event_id', as: 'orders' });
Order.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Seat.hasMany(OrderItem, { foreignKey: 'seat_id', as: 'orderItems' });
OrderItem.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

Seat.belongsTo(User, { foreignKey: 'locked_by', as: 'lockedByUser' });

Event.hasMany(QueueEntry, { foreignKey: 'event_id', as: 'queueEntries' });
QueueEntry.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

User.hasMany(QueueEntry, { foreignKey: 'user_id', as: 'queueEntries' });
QueueEntry.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Event,
  SeatSection,
  Seat,
  Order,
  OrderItem,
  QueueEntry,
};


