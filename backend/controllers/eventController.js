const { Op } = require('sequelize');
const { Event, SeatSection, Seat, Order } = require('../models');

const createEvent = async (req, res) => {
  try {
    const { title, description, category, venueName, venueAddress, eventDate, saleStartAt, posterUrl } = req.body;

    if (!eventDate) {
      return res.status(400).json({ error: true, message: 'Vui lòng nhập ngày sự kiện.' });
    }
    // [FIX #19] Reject events scheduled in the past
    if (new Date(eventDate) < new Date()) {
      return res.status(400).json({ error: true, message: 'Ngày diễn ra sự kiện phải trong tương lai.' });
    }
    
    if (!saleStartAt) {
      return res.status(400).json({ error: true, message: 'Bạn chưa chọn ngày mở bán vé.' });
    }

    if (saleStartAt && new Date(saleStartAt) >= new Date(eventDate)) {
      return res.status(400).json({ error: true, message: 'Ngày mở bán vé phải trước ngày diễn ra sự kiện.' });
    }

    const event = await Event.create({
      title, description, category, venueName, venueAddress,
      eventDate, saleStartAt, posterUrl, status: 'draft',
    });

    res.status(201).json({ message: 'Tạo sự kiện thành công', event });
  } catch (error) {
    console.error('CreateEvent error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const addSection = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, rowsCount, seatsPerRow, price, colorCode, hiddenSeats = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: true, message: 'Vui lòng nhập tên khu vực ghế.' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: true, message: 'Sự kiện không tồn tại' });
    }

    const section = await SeatSection.create({
      eventId: parseInt(eventId), name, rowsCount, seatsPerRow, price, colorCode,
    });

    const hiddenSet = new Set(hiddenSeats.map(h => `${h.row}-${h.col}`));

    // Auto-generate seats
    const seats = [];
    for (let row = 0; row < rowsCount; row++) {
      const rowLabel = String.fromCharCode(65 + row); // A, B, C...
      let seatNum = 1;
      for (let col = 0; col < seatsPerRow; col++) {
        const isHidden = hiddenSet.has(`${row}-${col}`);
        seats.push({
          sectionId: section.id,
          rowLabel,
          seatNumber: isHidden ? 0 : seatNum,
          status: 'available',
          version: 0,
        });
        if (!isHidden) seatNum++;
      }
    }
    await Seat.bulkCreate(seats);

    res.status(201).json({
      message: `Tạo khu ${name} thành công`,
      section,
      seatsCreated: seats.length,
    });
  } catch (error) {
    console.error('AddSection error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 12, dateFrom, dateTo, city } = req.query;
    const where = {};

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    } else {
      where.status = 'published';
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.eventDate = {};
      if (dateFrom) where.eventDate[Op.gte] = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.eventDate[Op.lte] = end;
      }
    }

    // City/location filter — searches both venueName and venueAddress
    if (city && city !== 'all') {
      where[Op.or] = [
        { venueName: { [Op.iLike]: `%${city}%` } },
        { venueAddress: { [Op.iLike]: `%${city}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Price range filter — filters on SeatSection.price
    const sectionWhere = {};
    const priceMin = req.query.priceMin !== undefined ? parseFloat(req.query.priceMin) : null;
    const priceMax = req.query.priceMax !== undefined ? parseFloat(req.query.priceMax) : null;
    if (priceMin !== null) sectionWhere.price = { ...sectionWhere.price, [Op.gte]: priceMin };
    if (priceMax !== null) sectionWhere.price = { ...sectionWhere.price, [Op.lte]: priceMax };

    const hasPriceFilter = priceMin !== null || priceMax !== null;
    const sectionFilter = {
      model: SeatSection,
      as: 'sections',
      attributes: ['id', 'name', 'price', 'rowsCount', 'seatsPerRow', 'colorCode'],
      ...(hasPriceFilter ? { where: sectionWhere, required: true } : {}),
    };

    const { rows: events, count: total } = await Event.findAndCountAll({
      where,
      include: [sectionFilter],
      order: [['eventDate', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });


    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetAllEvents error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: SeatSection,
        as: 'sections',
        include: [{
          model: Seat,
          as: 'seats',
          attributes: ['id', 'rowLabel', 'seatNumber', 'status'],
        }],
      }],
    });

    if (!event) {
      return res.status(404).json({ error: true, message: 'Sự kiện không tồn tại' });
    }

    res.json({ event });
  } catch (error) {
    console.error('GetEventById error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: true, message: 'Sự kiện không tồn tại' });
    }

    // [FIX #18] Validate date logic on update
    if (req.body.saleStartAt === '') {
      return res.status(400).json({ error: true, message: 'Bạn chưa chọn ngày mở bán vé.' });
    }

    const newEventDate = req.body.eventDate ? new Date(req.body.eventDate) : new Date(event.eventDate);
    const newSaleStart = req.body.saleStartAt
      ? new Date(req.body.saleStartAt)
      : event.saleStartAt ? new Date(event.saleStartAt) : null;

    if (newSaleStart && newSaleStart >= newEventDate) {
      return res.status(400).json({
        error: true,
        message: 'Ngày mở bán vé phải trước ngày diễn ra sự kiện.',
      });
    }

    await event.update(req.body);
    res.json({ message: 'Cập nhật thành công', event });
  } catch (error) {
    console.error('UpdateEvent error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: true, message: 'Sự kiện không tồn tại' });
    }

    // [FIX #20] Block delete if any paid orders exist — would cause data loss / no refund
    const paidCount = await Order.count({
      where: { eventId: req.params.id, status: 'paid' },
    });
    if (paidCount > 0) {
      return res.status(409).json({
        error: true,
        message: `Không thể xóa: sự kiện có ${paidCount} đơn hàng đã thanh toán. Hãy hủy sự kiện thay vì xóa.`,
      });
    }

    // Auto-cancel pending orders before deleting
    await Order.update(
      { status: 'cancelled' },
      { where: { eventId: req.params.id, status: 'pending' } }
    );

    await event.destroy();
    res.json({ message: 'Xóa sự kiện thành công' });
  } catch (error) {
    console.error('DeleteEvent error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await SeatSection.findByPk(sectionId);
    if (!section) {
      return res.status(404).json({ error: true, message: 'Khu vực không tồn tại' });
    }

    // [SECURITY] Block deletion if any seats are already sold or locked
    const busySeats = await Seat.count({
      where: { sectionId, status: { [Op.ne]: 'available' } }
    });
    if (busySeats > 0) {
      return res.status(400).json({ 
        error: true, 
        message: 'Không thể xóa khu vực này vì đã có ghế được đặt hoặc đang được chọn.' 
      });
    }

    // Delete associated seats first
    await Seat.destroy({ where: { sectionId } });
    await section.destroy();

    res.json({ message: 'Xóa khu vực thành công' });
  } catch (error) {
    console.error('DeleteSection error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { createEvent, addSection, deleteSection, getAllEvents, getEventById, updateEvent, deleteEvent };

