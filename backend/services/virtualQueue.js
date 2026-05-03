const { Op } = require('sequelize');
const { QueueEntry, Event } = require('../models');
const crypto = require('crypto');

const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE) || 10;

const admitNextBatch = async (eventId, io) => {
  try {
    // [FIX 4] Check event is still published before admitting
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== 'published') {
      return 0;
    }
    const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_USERS) || 50;

    // Check how many people are currently admitted and active (within 10 mins)
    const activeCount = await QueueEntry.count({
      where: {
        eventId,
        status: 'admitted',
        admittedAt: { [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    const availableSlots = MAX_CONCURRENT - activeCount;
    if (availableSlots <= 0) {
      return 0; // Queue is full, nobody gets in this batch
    }

    const limitToAdmit = Math.min(BATCH_SIZE, availableSlots);

    const waiting = await QueueEntry.findAll({
      where: { eventId, status: 'waiting' },
      order: [['position', 'ASC']],
      limit: limitToAdmit,
    });

    for (const entry of waiting) {
      const token = crypto.randomUUID();
      await entry.update({
        status: 'admitted',
        accessToken: token,
        admittedAt: new Date(),
      });

      if (io) {
        io.to(`queue:${eventId}:${entry.userId}`).emit('queue:admitted', {
          accessToken: token,
          message: 'Đến lượt bạn! Hãy chọn ghế ngay.',
        });
      }
    }

    return waiting.length;
  } catch (error) {
    console.error('AdmitNextBatch error:', error);
    return 0;
  }
};

module.exports = { admitNextBatch };
