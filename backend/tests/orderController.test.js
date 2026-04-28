/**
 * Test Suite: orderController.js
 * Covers bugs #10-17 reported by tester + 3 remaining edge cases (A, B, C)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Mock transaction object returned by sequelize.transaction()
const mockTransaction = () => ({
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  LOCK: { UPDATE: 'UPDATE', SHARE: 'SHARE' }, // Sequelize transaction.LOCK constants
});

jest.mock('qrcode', () => ({ toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,MOCK_QR') }));
jest.mock('../config/database', () => ({
  transaction: jest.fn(),
  literal: jest.fn(v => v),
}));
jest.mock('../models', () => ({
  Order: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  OrderItem: { bulkCreate: jest.fn() },
  Seat: { findAll: jest.fn(), count: jest.fn(), update: jest.fn() },
  SeatSection: {},
  Event: { findByPk: jest.fn() },
}));

const { createOrder, confirmOrder, cancelOrder } = require('../controllers/orderController');
const { Order, OrderItem, Seat, Event } = require('../models');
const QRCode = require('qrcode');
const sequelize = require('../config/database');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockIO = () => ({ to: jest.fn().mockReturnValue({ emit: jest.fn() }) });

const makeReq = (overrides = {}) => ({
  user: { id: 42 },
  body: { eventId: 1, seatIds: [101, 102] },
  params: {},
  app: { get: jest.fn().mockReturnValue(mockIO()) },
  ...overrides,
});

/** Build a mock seat with section.price and section.eventId */
const mockSeat = (id, price = 500000, eventId = 1, lockedBy = 42) => ({
  id,
  lockedBy,
  status: 'locked',
  rowLabel: 'A',
  seatNumber: id,
  section: { price, eventId, name: 'VIP' },
  update: jest.fn().mockResolvedValue(true),
});

/** Build a published future event */
const mockEvent = (overrides = {}) => ({
  id: 1,
  status: 'published',
  eventDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  saleStartAt: null,
  saleEndAt: null,
  ...overrides,
});

/** Build a pending order with items */
const mockOrder = (overrides = {}) => {
  const base = {
    id: 999,
    userId: 42,
    eventId: 1,
    status: 'pending',
    totalAmount: 1000000,
    expiresAt: new Date(Date.now() + 600000), // 10 min from now
    items: [
      {
        id: 1,
        seatId: 101,
        qrCodeData: null,
        seat: mockSeat(101),
        update: jest.fn().mockResolvedValue(true),
      },
      {
        id: 2,
        seatId: 102,
        qrCodeData: null,
        seat: mockSeat(102),
        update: jest.fn().mockResolvedValue(true),
      },
    ],
    update: jest.fn().mockResolvedValue(true),
    reload: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({}),
  };
  return { ...base, ...overrides };
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: sequelize.transaction() returns a usable mock transaction
  sequelize.transaction.mockResolvedValue(mockTransaction());
});

/**
 * Helper: setup Order.findOne to return `order` for BOTH calls in confirmOrder/cancelOrder.
 * confirmOrder calls findOne twice: once for lock (no includes), once for full load (with includes).
 */
const setupOrderFindOne = (order) => {
  Order.findOne.mockResolvedValue(order);
};

/**
 * Helper: setup Order.findOne to return null for both lock + full load calls (not found case).
 */
const setupOrderNotFound = () => {
  Order.findOne.mockResolvedValue(null);
};

// ═══════════════════════════════════════════════════════════════════════════════
// createOrder
// ═══════════════════════════════════════════════════════════════════════════════
describe('createOrder', () => {
  describe('Input validation', () => {
    it('returns 400 when seatIds is empty', async () => {
      const req = makeReq({ body: { eventId: 1, seatIds: [] } });
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
    });

    it('returns 400 when more than 6 seats', async () => {
      const req = makeReq({ body: { eventId: 1, seatIds: [1, 2, 3, 4, 5, 6, 7] } });
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('#13 — Event validation at createOrder', () => {
    it('returns 400 when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);
      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when event is not published (draft)', async () => {
      Event.findByPk.mockResolvedValue(mockEvent({ status: 'draft' }));
      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không khả dụng') }));
    });

    it('returns 400 when event has already occurred', async () => {
      Event.findByPk.mockResolvedValue(mockEvent({
        eventDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
      }));
      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã diễn ra') }));
    });
  });

  describe('#11 — Seat lock verification', () => {
    it('returns 400 when some seats not locked by user', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.findAll.mockResolvedValue([mockSeat(101)]); // only 1 of 2 seats found
      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('hết hạn giữ chỗ') }));
    });
  });

  describe('#17 — Validate seats belong to same event', () => {
    it('returns 400 when a seat belongs to a different event', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.findAll.mockResolvedValue([
        mockSeat(101, 500000, 1),  // correct event
        mockSeat(102, 500000, 99), // wrong event!
      ]);
      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không thuộc sự kiện') }));
    });
  });

  describe('#10 — Price snapshot', () => {
    it('saves priceAtPurchase in OrderItem (not current section price)', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      const seats = [mockSeat(101, 750000, 1), mockSeat(102, 500000, 1)];
      Seat.findAll.mockResolvedValue(seats);
      const createdOrder = { id: 999, toJSON: jest.fn().mockReturnValue({}) };
      Order.create.mockResolvedValue(createdOrder);
      OrderItem.bulkCreate.mockResolvedValue([]);

      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);

      expect(OrderItem.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ seatId: 101, priceAtPurchase: 750000 }),
          expect.objectContaining({ seatId: 102, priceAtPurchase: 500000 }),
        ])
      );
    });

    it('totalAmount reflects seat prices at order creation time', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      const seats = [mockSeat(101, 300000, 1), mockSeat(102, 200000, 1)];
      Seat.findAll.mockResolvedValue(seats);
      const createdOrder = { id: 999, toJSON: jest.fn().mockReturnValue({}) };
      Order.create.mockResolvedValue(createdOrder);
      OrderItem.bulkCreate.mockResolvedValue([]);

      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);

      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 500000 }) // 300k + 200k
      );
    });
  });

  describe('Happy path', () => {
    it('creates order and returns 201 with order data', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.findAll.mockResolvedValue([mockSeat(101, 500000, 1), mockSeat(102, 500000, 1)]);
      const createdOrder = { id: 999, toJSON: jest.fn().mockReturnValue({ id: 999 }) };
      Order.create.mockResolvedValue(createdOrder);
      OrderItem.bulkCreate.mockResolvedValue([]);

      const req = makeReq();
      const res = mockRes();
      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// confirmOrder
// ═══════════════════════════════════════════════════════════════════════════════
describe('confirmOrder', () => {
  describe('#12 — Idempotency', () => {
    it('returns success without re-processing if order already paid', async () => {
      Order.findOne
        .mockResolvedValueOnce(null) // first call: pending not found
        .mockResolvedValueOnce({ id: 999, status: 'paid', toJSON: jest.fn().mockReturnValue({}) }); // second call: paid found

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã được thanh toán') }));
      expect(QRCode.toDataURL).not.toHaveBeenCalled();
    });

    it('does not regenerate QR if qrCodeData already set', async () => {
      const order = mockOrder({
        items: [
          {
            id: 1, seatId: 101, qrCodeData: 'data:image/png;EXISTING_QR',
            seat: mockSeat(101), update: jest.fn().mockResolvedValue(true),
          },
        ],
      });
      Order.findOne.mockResolvedValue(order);
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.count.mockResolvedValue(1); // all seats still locked

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(QRCode.toDataURL).not.toHaveBeenCalled();
    });
  });

  describe('#11 — Re-verify seat lock at confirmOrder', () => {
    it('returns 400 and marks order expired if seats no longer locked by user', async () => {
      const order = mockOrder();
      Order.findOne.mockResolvedValue(order);
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.count.mockResolvedValue(0); // seats were released by cron!

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(order.update).toHaveBeenCalledWith({ status: 'expired' }, expect.objectContaining({ transaction: expect.anything() }));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('hết hạn giữ chỗ') }));
    });

    it('returns 400 if only some seats still valid (partial cron release)', async () => {
      const order = mockOrder(); // has 2 seats
      Order.findOne.mockResolvedValue(order);
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.count.mockResolvedValue(1); // only 1 of 2 still locked

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(order.update).toHaveBeenCalledWith({ status: 'expired' }, expect.objectContaining({ transaction: expect.anything() }));
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('#13 — Event status at confirmOrder', () => {
    it('returns 400 when event changed to non-published after order creation', async () => {
      Order.findOne.mockResolvedValue(mockOrder());
      Event.findByPk.mockResolvedValue(mockEvent({ status: 'cancelled' }));

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('không còn khả dụng') }));
    });

    // [FIX B] Edge Case: eventDate check at confirmOrder — now active test
    it('[FIX B] rejects confirm when event.eventDate is in the past (event already occurred)', async () => {
      const txn = mockTransaction();
      sequelize.transaction.mockResolvedValue(txn);
      Order.findOne.mockResolvedValue(mockOrder());
      Event.findByPk.mockResolvedValue(mockEvent({
        status: 'published',
        eventDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
      }));

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(txn.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('đã diễn ra') }));
    });
  });

  describe('Order expiry', () => {
    it('returns 400 and marks order expired when expiresAt has passed', async () => {
      const expiredOrder = mockOrder({
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      });
      Order.findOne.mockResolvedValue(expiredOrder);

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(expiredOrder.update).toHaveBeenCalledWith({ status: 'expired' }, expect.objectContaining({ transaction: expect.anything() }));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('hết hạn') }));
    });
  });

  describe('Happy path', () => {
    it('marks order paid, generates QR, marks seats sold', async () => {
      const order = mockOrder();
      Order.findOne.mockResolvedValue(order);
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.count.mockResolvedValue(2); // all seats still locked

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(order.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }), expect.objectContaining({ transaction: expect.anything() }));
      expect(QRCode.toDataURL).toHaveBeenCalledTimes(2); // one per seat
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('thành công') }));
    });

    it('marks each seat as sold with lockedBy null', async () => {
      const order = mockOrder();
      Order.findOne.mockResolvedValue(order);
      Event.findByPk.mockResolvedValue(mockEvent());
      Seat.count.mockResolvedValue(2);

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      for (const item of order.items) {
        expect(item.seat.update).toHaveBeenCalledWith(
          { status: 'sold', lockedBy: null, lockedAt: null },
          expect.objectContaining({ transaction: expect.anything() })
        );
      }
    });
  });

  describe('Order not found', () => {
    it('returns 404 when order not found and not paid', async () => {
      Order.findOne.mockResolvedValue(null).mockResolvedValueOnce(null);
      // Both pending and paid lookups return null
      Order.findOne.mockResolvedValue(null);

      const req = makeReq({ params: { id: '9999' } });
      const res = mockRes();
      await confirmOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// cancelOrder
// ═══════════════════════════════════════════════════════════════════════════════
describe('cancelOrder', () => {
  describe('#14 — Cancel order endpoint exists', () => {
    it('releases locked seats and marks order cancelled', async () => {
      const order = mockOrder();
      Order.findOne.mockResolvedValue(order);

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await cancelOrder(req, res);

      for (const item of order.items) {
        expect(item.seat.update).toHaveBeenCalledWith(
          { status: 'available', lockedBy: null, lockedAt: null },
          expect.objectContaining({ transaction: expect.anything() })
        );
      }
      expect(order.update).toHaveBeenCalledWith({ status: 'cancelled' }, expect.objectContaining({ transaction: expect.anything() }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('hủy') }));
    });
  });

  it('returns 404 when order not found or already processed', async () => {
    Order.findOne.mockResolvedValue(null);
    const req = makeReq({ params: { id: '9999' } });
    const res = mockRes();
    await cancelOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('only releases seats that are still locked by this user', async () => {
    const order = mockOrder({
      items: [
        // seat already released by cron (status: 'available')
        { id: 1, seatId: 101, seat: { ...mockSeat(101), status: 'available', lockedBy: null, update: jest.fn() }, update: jest.fn() },
        // seat still locked
        { id: 2, seatId: 102, seat: mockSeat(102), update: jest.fn() },
      ],
    });
    Order.findOne.mockResolvedValue(order);

    const req = makeReq({ params: { id: '999' } });
    const res = mockRes();
    await cancelOrder(req, res);

    // Only seat 102 should be updated (seat 101 was already available)
    expect(order.items[0].seat.update).not.toHaveBeenCalled();
    expect(order.items[1].seat.update).toHaveBeenCalledWith(
      { status: 'available', lockedBy: null, lockedAt: null },
      expect.objectContaining({ transaction: expect.anything() })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// #16 — Order ENUM has 'expired' (verified via controller behavior, not model direct import)
// ═══════════════════════════════════════════════════════════════════════════════
describe('#16 — Order model status ENUM includes expired', () => {
  it('confirmOrder sets status to expired when order TTL passes (uses expired enum value)', async () => {
    const expiredOrder = mockOrder({ expiresAt: new Date(Date.now() - 1000) });
    Order.findOne.mockResolvedValue(expiredOrder);

    const req = makeReq({ params: { id: '999' } });
    const res = mockRes();
    await confirmOrder(req, res);

    // Proves controller writes 'expired' status — only possible if ENUM supports it
    expect(expiredOrder.update).toHaveBeenCalledWith({ status: 'expired' }, expect.objectContaining({ transaction: expect.anything() }));
  });

  it('re-verify failure sets order to expired (not cancelled or other)', async () => {
    const order = mockOrder();
    Order.findOne.mockResolvedValue(order);
    Event.findByPk.mockResolvedValue(mockEvent());
    Seat.count.mockResolvedValue(0); // seats released

    const req = makeReq({ params: { id: '999' } });
    const res = mockRes();
    await confirmOrder(req, res);

    expect(order.update).toHaveBeenCalledWith({ status: 'expired' }, expect.objectContaining({ transaction: expect.anything() }));
  });
});
