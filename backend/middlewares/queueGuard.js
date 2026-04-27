const { Op } = require('sequelize');
const { QueueEntry, Event } = require('../models');
const crypto = require('crypto');

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_USERS) || 50;

const queueGuard = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    if (!eventId) return next();

    const userId = req.user.id;

    // [FIX 2] Check event status & saleStartAt before allowing access
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== 'published') {
      return res.status(403).json({ error: true, message: 'Sự kiện không khả dụng' });
    }
    if (event.saleStartAt && new Date() < new Date(event.saleStartAt)) {
      return res.status(403).json({ error: true, message: 'Chưa đến thời gian mở bán vé' });
    }

    // Check if user has access token (already admitted)
    const admitted = await QueueEntry.findOne({
      where: { eventId, userId, status: 'admitted' },
    });

    if (admitted) {
      // [FIX 1] Sync TTL to match seat lock timeout (10 min, was 15 min)
      const admittedTime = new Date(admitted.admittedAt);
      const elapsed = Date.now() - admittedTime.getTime();
      if (elapsed < 10 * 60 * 1000) {
        return next(); // Allowed through
      }
      // Expired, mark as expired
      await admitted.update({ status: 'expired' });
    }

    // [FIX 1] activeCount window also synced to 10 min (was 15 min)
    const activeCount = await QueueEntry.count({
      where: {
        eventId,
        status: 'admitted',
        admittedAt: { [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (activeCount < MAX_CONCURRENT) {
      // [FIX 5] Use real next position instead of 0
      const maxPos = await QueueEntry.max('position', {
        where: { eventId, status: 'waiting' },
      }) || 0;

      const token = crypto.randomUUID();
      await QueueEntry.upsert({
        eventId: parseInt(eventId),
        userId,
        position: maxPos + 1,
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
