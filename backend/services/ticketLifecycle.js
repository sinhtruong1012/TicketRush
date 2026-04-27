const cron = require('node-cron');
const seatLockService = require('./seatLockService');
const { admitNextBatch } = require('./virtualQueue');
const { QueueEntry } = require('../models');
const { Op } = require('sequelize');

let ioInstance = null;

const start = () => {
  // Every 30s: release expired locked seats
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const released = await seatLockService.releaseExpiredSeats(ioInstance);
      if (released > 0) {
        console.log(`🔓 Auto-released ${released} expired seats`);
      }
    } catch (error) {
      console.error('Ticket lifecycle error:', error);
    }
  });

  // Every 30s: admit next batch from queue for each active event
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Find all events that have users waiting in queue
      const waitingEntries = await QueueEntry.findAll({
        where: { status: 'waiting' },
        attributes: ['eventId'],
        group: ['eventId'],
        raw: true,
      });

      for (const { eventId } of waitingEntries) {
        const admitted = await admitNextBatch(eventId, ioInstance);
        if (admitted > 0) {
          console.log(`🎟️  Admitted ${admitted} users for event ${eventId}`);
        }
      }
    } catch (error) {
      console.error('Queue admit batch error:', error);
    }
  });
};

const setIO = (io) => {
  ioInstance = io;
};

module.exports = { start, setIO };
