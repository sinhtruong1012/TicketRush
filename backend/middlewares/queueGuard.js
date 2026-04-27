const { Op } = require('sequelize');
const { QueueEntry, Seat, SeatSection } = require('../models');
const crypto = require('crypto');

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_USERS) || 50;
const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE) || 10;

const queueGuard = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    if (!eventId) return next();

    const userId = req.user.id;

    // Check if user has access token (already admitted)
    const admitted = await QueueEntry.findOne({
      where: { eventId, userId, status: 'admitted' },
    });

    if (admitted) {
      // Check if access token hasn't expired (15 min)
      const admittedTime = new Date(admitted.admittedAt);
      const elapsed = Date.now() - admittedTime.getTime();
      if (elapsed < 15 * 60 * 1000) {
        return next(); // Allowed through
      }
      // Expired, mark as expired
      await admitted.update({ status: 'expired' });
    }

    // Count active users (those currently selecting seats - have locked seats or were recently admitted)
    const activeCount = await QueueEntry.count({
      where: {
        eventId,
        status: 'admitted',
        admittedAt: { [Op.gte]: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (activeCount < MAX_CONCURRENT) {
      // Auto-admit this user
      const token = crypto.randomUUID();
      await QueueEntry.upsert({
        eventId: parseInt(eventId),
        userId,
        position: 0,
        accessToken: token,
        status: 'admitted',
        admittedAt: new Date(),
      });
      return next();
    }

    // Queue is full — return queued status
    return res.status(202).json({
      queued: true,
      message: 'Hệ thống đang quá tải. Bạn sẽ được chuyển vào phòng chờ.',
      eventId,
    });
  } catch (error) {
    console.error('QueueGuard error:', error);
    next(); // Fail open
  }
};

module.exports = queueGuard;
