const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { QueueEntry } = require('../models');

const joinQueue = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if already in queue
    const existing = await QueueEntry.findOne({
      where: { eventId, userId, status: { [Op.in]: ['waiting', 'admitted'] } },
    });

    if (existing) {
      return res.json({
        message: existing.status === 'admitted' ? 'Bạn đã được vào' : 'Bạn đang trong hàng đợi',
        entry: existing,
      });
    }

    // Get next position
    const maxPosition = await QueueEntry.max('position', { where: { eventId } }) || 0;

    const entry = await QueueEntry.create({
      eventId: parseInt(eventId),
      userId,
      position: maxPosition + 1,
      status: 'waiting',
    });

    res.status(201).json({ message: 'Đã vào hàng đợi', entry });
  } catch (error) {
    console.error('JoinQueue error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const entry = await QueueEntry.findOne({
      where: { eventId, userId, status: { [Op.in]: ['waiting', 'admitted'] } },
    });

    if (!entry) {
      return res.status(404).json({ error: true, message: 'Không trong hàng đợi' });
    }

    if (entry.status === 'admitted') {
      return res.json({
        status: 'admitted',
        accessToken: entry.accessToken,
        message: 'Bạn đã được vào, hãy chọn ghế!',
      });
    }

    // Count people ahead
    const aheadCount = await QueueEntry.count({
      where: {
        eventId,
        status: 'waiting',
        position: { [Op.lt]: entry.position },
      },
    });

    const estimatedMinutes = Math.ceil(aheadCount / 10) * 2; // ~2 min per batch of 10

    res.json({
      status: 'waiting',
      position: aheadCount + 1,
      estimatedMinutes,
      message: `Bạn đang ở vị trí thứ ${aheadCount + 1} trong hàng đợi`,
    });
  } catch (error) {
    console.error('GetQueueStatus error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { joinQueue, getQueueStatus };
