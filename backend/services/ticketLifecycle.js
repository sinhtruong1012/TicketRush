const cron = require('node-cron');
const seatLockService = require('./seatLockService');
const { admitNextBatch } = require('./virtualQueue');
const { QueueEntry, Order } = require('../models');
const { Op } = require('sequelize');

let ioInstance = null;
let isReleasingSeats = false; // [FIX 8] In-process lock
let isAdmittingBatch = false; // [FIX 8] In-process lock

const start = () => {
  // Every 30s: release expired locked seats
  cron.schedule('*/30 * * * * *', async () => {
    if (isReleasingSeats) return; // [FIX 8] Skip if already running
    isReleasingSeats = true;
    try {
      const released = await seatLockService.releaseExpiredSeats(ioInstance);
      if (released > 0) {
        console.log(`🔓 Auto-released ${released} expired seats`);
      }
    } catch (error) {
      console.error('Ticket lifecycle error:', error);
    } finally {
      isReleasingSeats = false; // [FIX 8] Always release lock
    }
  });

  // Every 30s: admit next batch from queue for each active event
  cron.schedule('*/30 * * * * *', async () => {
    if (isAdmittingBatch) return; // [FIX 8] Skip if already running
    isAdmittingBatch = true;
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
    } finally {
      isAdmittingBatch = false;
    }
  });

  // [FIX 15] Every 60s: mark expired pending orders as 'expired'
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const [updated] = await Order.update(
        { status: 'expired' },
        {
          where: {
            status: 'pending',
            expiresAt: { [Op.lt]: new Date() },
          },
        }
      );
      if (updated > 0) {
        console.log(`⏳ Marked ${updated} pending orders as expired`);
      }
    } catch (error) {
      console.error('Order expiry cleanup error:', error);
    }
  });
};

const setIO = (io) => {
  ioInstance = io;
};

module.exports = { start, setIO };
