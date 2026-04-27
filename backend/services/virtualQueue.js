const { Op } = require('sequelize');
const { QueueEntry } = require('../models');
const crypto = require('crypto');

const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE) || 10;

const admitNextBatch = async (eventId, io) => {
  try {
    const waiting = await QueueEntry.findAll({
      where: { eventId, status: 'waiting' },
      order: [['position', 'ASC']],
      limit: BATCH_SIZE,
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
