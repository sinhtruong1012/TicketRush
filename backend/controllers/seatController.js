const { Seat, SeatSection, Event } = require('../models');
const seatLockService = require('../services/seatLockService');

const getSeatsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId, {
      attributes: ['id', 'title', 'posterUrl', 'eventDate', 'venueName']
    });

    if (!event) return res.status(404).json({ error: true, message: 'Không tìm thấy sự kiện' });

    const sections = await SeatSection.findAll({
      where: { eventId },
      include: [{
        model: Seat,
        as: 'seats',
        attributes: ['id', 'rowLabel', 'seatNumber', 'status', 'lockedBy'],
      }],
      order: [['name', 'ASC'], [{ model: Seat, as: 'seats' }, 'rowLabel', 'ASC'], [{ model: Seat, as: 'seats' }, 'seatNumber', 'ASC']],
    });

    res.json({ event, sections });
  } catch (error) {
    console.error('GetSeats error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const lockSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    const result = await seatLockService.lockSeat(parseInt(seatId), userId);

    if (result.success) {
      // Broadcast seat status change via WebSocket
      const seat = await Seat.findByPk(seatId, {
        include: [{ model: SeatSection, as: 'section' }],
      });
      if (seat) {
        io.to(`event:${seat.section.eventId}`).emit('seat:locked', {
          seatId: seat.id,
          status: 'locked',
        });
      }
      res.json({ message: 'Giữ ghế thành công', seat: result.seat });
    } else {
      res.status(409).json({ error: true, message: result.message });
    }
  } catch (error) {
    console.error('LockSeat error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const unlockSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    const result = await seatLockService.unlockSeat(parseInt(seatId), userId);

    if (result.success) {
      const seat = await Seat.findByPk(seatId, {
        include: [{ model: SeatSection, as: 'section' }],
      });
      if (seat) {
        io.to(`event:${seat.section.eventId}`).emit('seat:released', {
          seatId: seat.id,
          status: 'available',
        });
      }
      res.json({ message: 'Hủy giữ ghế thành công' });
    } else {
      res.status(400).json({ error: true, message: result.message });
    }
  } catch (error) {
    console.error('UnlockSeat error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { getSeatsForEvent, lockSeat, unlockSeat };
