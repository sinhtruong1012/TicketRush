const sequelize = require('../config/database');
const { Seat } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Lock a seat using PostgreSQL FOR UPDATE SKIP LOCKED
 * This ensures only ONE user can lock a seat even with concurrent requests
 */
const lockSeat = async (seatId, userId) => {
  const transaction = await sequelize.transaction();

  try {
    // Find seat to get eventId (for per-event limit)
    const targetSeat = await Seat.findByPk(seatId, {
      include: [{ model: require('../models/SeatSection'), as: 'section', attributes: ['eventId'] }],
      transaction,
    });

    if (!targetSeat) {
      await transaction.rollback();
      return { success: false, message: 'Không tìm thấy ghế' };
    }

    const eventId = targetSeat.section?.eventId;

    // Check how many seats user has locked FOR THIS EVENT (max 4)
    const lockedCount = await Seat.count({
      where: { lockedBy: userId, status: 'locked' },
      include: [{
        model: require('../models/SeatSection'),
        as: 'section',
        where: { eventId },
        attributes: [],
        required: true,
      }],
      transaction,
    });

    if (lockedCount >= 4) {
      await transaction.rollback();
      return { success: false, message: 'Bạn chỉ được giữ tối đa 4 ghế mỗi sự kiện' };
    }

    // PostgreSQL row-level locking with SKIP LOCKED
    const rows = await sequelize.query(
      `SELECT id FROM seats
       WHERE id = :seatId AND status = 'available'
       FOR UPDATE SKIP LOCKED`,
      {
        replacements: { seatId },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    // rows is an array; if empty → seat is locked/sold by someone else
    if (!rows || rows.length === 0) {
      await transaction.rollback();
      return { success: false, message: 'Ghế đã được người khác chọn' };
    }

    // Lock the seat
    await Seat.update(
      {
        status: 'locked',
        lockedBy: userId,
        lockedAt: new Date(),
        version: sequelize.literal('version + 1'),
      },
      {
        where: { id: seatId, status: 'available' },
        transaction,
      }
    );

    await transaction.commit();

    const seat = await Seat.findByPk(seatId);
    return { success: true, seat };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Unlock a seat (only by the user who locked it)
 */
const unlockSeat = async (seatId, userId) => {
  const [affectedRows] = await Seat.update(
    {
      status: 'available',
      lockedBy: null,
      lockedAt: null,
      version: sequelize.literal('version + 1'),
    },
    {
      where: { id: seatId, lockedBy: userId, status: 'locked' },
    }
  );

  if (affectedRows === 0) {
    return { success: false, message: 'Không thể hủy giữ ghế này' };
  }

  return { success: true };
};

/**
 * Release expired locked seats (called by cron job)
 */
const releaseExpiredSeats = async (io) => {
  const timeoutMinutes = parseInt(process.env.SEAT_LOCK_TIMEOUT_MINUTES) || 10;
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const expiredSeats = await Seat.findAll({
    where: {
      status: 'locked',
      lockedAt: { [require('sequelize').Op.lt]: cutoff },
    },
    include: [{ model: require('../models/SeatSection'), as: 'section' }],
  });

  if (expiredSeats.length === 0) return 0;

  for (const seat of expiredSeats) {
    await seat.update({
      status: 'available',
      lockedBy: null,
      lockedAt: null,
      version: sequelize.literal('version + 1'),
    });

    // Broadcast via WebSocket
    if (io && seat.section) {
      io.to(`event:${seat.section.eventId}`).emit('seat:released', {
        seatId: seat.id,
        status: 'available',
      });
    }
  }

  console.log(`🔓 Released ${expiredSeats.length} expired seats`);
  return expiredSeats.length;
};

module.exports = { lockSeat, unlockSeat, releaseExpiredSeats };
