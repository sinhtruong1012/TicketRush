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

    // Verify all seats are locked by this user
    const seats = await Seat.findAll({
      where: { id: seatIds, lockedBy: userId, status: 'locked' },
      include: [{ model: SeatSection, as: 'section' }],
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: true, message: 'Một số ghế không hợp lệ hoặc đã hết hạn giữ chỗ' });
    }

    const totalAmount = seats.reduce((sum, seat) => sum + parseFloat(seat.section.price), 0);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
      priceAtPurchase: seat.section.price,
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
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    const order = await Order.findOne({
      where: { id, userId, status: 'pending' },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }] }],
    });

    if (!order) {
      return res.status(404).json({ error: true, message: 'Đơn hàng không tồn tại hoặc đã xử lý' });
    }

    if (new Date() > order.expiresAt) {
      await order.update({ status: 'cancelled' });
      return res.status(400).json({ error: true, message: 'Đơn hàng đã hết hạn' });
    }

    // Update order to paid
    await order.update({
      status: 'paid',
      paidAt: new Date(),
    });

    // Generate QR per seat and update seats to sold
    for (const item of order.items) {
      const qrData = JSON.stringify({
        orderId: order.id,
        itemId: item.id,
        seatId: item.seat.id,
        section: item.seat.section.name,
        seat: `${item.seat.rowLabel}${item.seat.seatNumber}`,
        eventId: order.eventId,
      });
      const qrImage = await QRCode.toDataURL(qrData);
      await item.update({ qrCodeData: qrImage });

      await item.seat.update({ status: 'sold', lockedBy: null, lockedAt: null });
      io.to(`event:${item.seat.section.eventId}`).emit('seat:sold', {
        seatId: item.seat.id,
        status: 'sold',
      });
    }

    // Reload items with fresh qrCodeData
    await order.reload({
      include: [{ model: OrderItem, as: 'items', include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }] }],
    });

    res.json({
      message: 'Thanh toán thành công!',
      order: order.toJSON(),
    });
  } catch (error) {
    console.error('ConfirmOrder error:', error);
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

module.exports = { createOrder, confirmOrder, getMyTickets, getOrderById };
