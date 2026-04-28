const QRCode = require('qrcode');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Order, OrderItem, Seat, SeatSection, Event } = require('../models');

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, seatIds } = req.body;

    if (!seatIds || seatIds.length === 0) {
      return res.status(400).json({ error: true, message: 'Vui lòng chọn ghế' });
    }
    if (seatIds.length > 6) {
      return res.status(400).json({ error: true, message: 'Tối đa 6 ghế mỗi đơn' });
    }

    // [FIX 13] Check event status & date before creating order
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== 'published') {
      return res.status(400).json({ error: true, message: 'Sự kiện không khả dụng' });
    }
    if (new Date() > new Date(event.eventDate)) {
      return res.status(400).json({ error: true, message: 'Sự kiện đã diễn ra' });
    }

    // Verify all seats are locked by this user
    const seats = await Seat.findAll({
      where: { id: seatIds, lockedBy: userId, status: 'locked' },
      include: [{ model: SeatSection, as: 'section' }],
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: true, message: 'Một số ghế không hợp lệ hoặc đã hết hạn giữ chỗ' });
    }

    // [FIX 17] Ensure all seats belong to the specified eventId
    const wrongEvent = seats.some(seat => seat.section.eventId !== parseInt(eventId));
    if (wrongEvent) {
      return res.status(400).json({ error: true, message: 'Ghế không thuộc sự kiện này' });
    }

    // [FIX 10] Snapshot price at order creation time via priceAtPurchase in OrderItem
    const totalAmount = seats.reduce((sum, seat) => sum + parseFloat(seat.section.price), 0);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const order = await Order.create({
      userId,
      eventId: parseInt(eventId),
      totalAmount,
      status: 'pending',
      expiresAt,
    });

    const items = seats.map(seat => ({
      orderId: order.id,
      seatId: seat.id,
      priceAtPurchase: seat.section.price, // price locked at this moment
    }));
    await OrderItem.bulkCreate(items);

    res.status(201).json({
      message: 'Đơn hàng đã tạo, vui lòng thanh toán trong 10 phút',
      order: { ...order.toJSON(), items },
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const confirmOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const io = req.app.get('io');

  // [FIX A] SERIALIZABLE transaction prevents two simultaneous confirms from both
  // seeing status='pending' and double-processing the same order.
  const transaction = await sequelize.transaction({ isolationLevel: 'SERIALIZABLE' });

  try {
    // First: lock just the Order row atomically to prevent race condition (no nested joins)
    const orderLock = await Order.findOne({
      where: { id, userId, status: 'pending' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!orderLock) {
      await transaction.rollback();
      // [FIX 12] Idempotency: return success if already paid
      const paidOrder = await Order.findOne({ where: { id, userId, status: 'paid' } });
      if (paidOrder) {
        return res.json({ message: 'Đơn hàng đã được thanh toán', order: paidOrder.toJSON() });
      }
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại hoặc đã xử lý' });
    }

    // Then: load full order with relations (no lock needed — row already locked above)
    const order = await Order.findOne({
      where: { id, userId, status: 'pending' },
      include: [{
        model: OrderItem, as: 'items',
        include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }],
      }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại hoặc đã xử lý' });
    }

    if (new Date() > order.expiresAt) {
      await order.update({ status: 'expired' }, { transaction });
      await transaction.commit();
      return res.status(400).json({ error: true, message: 'Đơn hàng đã hết hạn' });
    }

    // [FIX 13] Re-check event status before confirming
    const event = await Event.findByPk(order.eventId, { transaction });
    if (!event || event.status !== 'published') {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: 'Sự kiện không còn khả dụng' });
    }

    // [FIX B] Also reject if the event has already taken place
    if (new Date() > new Date(event.eventDate)) {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: 'Sự kiện đã diễn ra, không thể thanh toán' });
    }

    // [FIX 11] Re-verify all seats still locked by this user (defend against cron release)
    const seatIds = order.items.map(item => item.seatId);
    const validSeatCount = await Seat.count({
      where: { id: seatIds, lockedBy: userId, status: 'locked' },
      transaction,
    });
    if (validSeatCount !== seatIds.length) {
      await order.update({ status: 'expired' }, { transaction });
      await transaction.commit();
      return res.status(400).json({
        error: true,
        message: 'Một hoặc nhiều ghế đã hết hạn giữ chỗ. Vui lòng chọn lại ghế.',
      });
    }

    // Mark order paid inside transaction
    await order.update({ status: 'paid', paidAt: new Date() }, { transaction });

    // Generate QR per seat and mark seats sold — all within the same transaction
    for (const item of order.items) {
      // [FIX 12] Only generate QR once (idempotency guard)
      if (!item.qrCodeData) {
        const qrData = JSON.stringify({
          orderId: order.id,
          itemId: item.id,
          seatId: item.seat.id,
          section: item.seat.section.name,
          seat: `${item.seat.rowLabel}${item.seat.seatNumber}`,
          eventId: order.eventId,
        });
        const qrImage = await QRCode.toDataURL(qrData);
        await item.update({ qrCodeData: qrImage }, { transaction });
      }

      await item.seat.update(
        { status: 'sold', lockedBy: null, lockedAt: null },
        { transaction }
      );
    }

    await transaction.commit();

    // Emit WebSocket events after commit so DB is in consistent state
    for (const item of order.items) {
      io.to(`event:${item.seat.section.eventId}`).emit('seat:sold', {
        seatId: item.seat.id,
        status: 'sold',
      });
    }

    await order.reload({
      include: [{
        model: OrderItem, as: 'items',
        include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }],
      }],
    });

    res.json({ message: 'Thanh toán thành công!', order: order.toJSON() });
  } catch (error) {
    await transaction.rollback();
    console.error('ConfirmOrder error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

// [FIX 14] Cancel pending order — releases seats immediately
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const io = req.app.get('io');

  // [FIX C] Wrap all seat releases + order update in a single transaction
  // so a mid-loop crash cannot leave some seats released and others still locked.
  const transaction = await sequelize.transaction();

  try {
    // Lock just the Order row first (no nested joins to avoid FOR UPDATE on outer join error)
    const orderLock = await Order.findOne({
      where: { id, userId, status: 'pending' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!orderLock) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại hoặc không thể hủy' });
    }

    // Load full order with relations
    const order = await Order.findOne({
      where: { id, userId, status: 'pending' },
      include: [{
        model: OrderItem, as: 'items',
        include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }],
      }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại hoặc không thể hủy' });
    }

    // Release all seats still locked by this user
    const releasedSeats = [];
    for (const item of order.items) {
      if (item.seat && item.seat.status === 'locked' && item.seat.lockedBy === userId) {
        await item.seat.update(
          { status: 'available', lockedBy: null, lockedAt: null },
          { transaction }
        );
        releasedSeats.push(item.seat);
      }
    }

    await order.update({ status: 'cancelled' }, { transaction });
    await transaction.commit();

    // Emit WebSocket events after commit
    for (const seat of releasedSeats) {
      if (io && seat.section) {
        io.to(`event:${seat.section.eventId}`).emit('seat:released', {
          seatId: seat.id,
          status: 'available',
        });
      }
    }

    res.json({ message: 'Đã hủy đơn hàng thành công' });
  } catch (error) {
    await transaction.rollback();
    console.error('CancelOrder error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id, status: 'paid' },
      include: [
        { model: Event, as: 'event' },
        { model: OrderItem, as: 'items', include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (error) {
    console.error('GetMyTickets error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Event, as: 'event' },
        { model: OrderItem, as: 'items', include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }] },
      ],
    });
    if (!order) {
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại' });
    }
    res.json({ order });
  } catch (error) {
    console.error('GetOrderById error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { createOrder, confirmOrder, cancelOrder, getMyTickets, getOrderById };
