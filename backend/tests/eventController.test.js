/**
 * eventController.test.js
 * Verifies fixes for bugs #18, #19, #20
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../config/database', () => ({
  transaction: jest.fn(),
  literal: jest.fn(v => v),
}));

jest.mock('../models', () => ({
  Event: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  SeatSection: {},
  Seat: {},
  Order: {
    count: jest.fn(),
    update: jest.fn(),
  },
}));

const { createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { Event, Order } = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  params: {},
  body: {},
  query: {},
  user: { id: 1, role: 'admin' },
  ...overrides,
});

const tomorrow = () => new Date(Date.now() + 86400000).toISOString();
const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const nextWeek = () => new Date(Date.now() + 7 * 86400000).toISOString();

const mockEvent = (overrides = {}) => ({
  id: 1,
  title: 'Test Event',
  eventDate: nextWeek(),
  saleStartAt: tomorrow(),
  status: 'draft',
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ═══════════════════════════════════════════════════════════════════════════════
// createEvent — Bug #19
// ═══════════════════════════════════════════════════════════════════════════════
describe('createEvent', () => {
  describe('#19 — eventDate must be in the future', () => {
    it('returns 400 when eventDate is in the past', async () => {
      const req = makeReq({ body: { eventDate: yesterday(), title: 'Old Event' } });
      const res = mockRes();
      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('tương lai') })
      );
    });

    it('returns 400 when eventDate is 1 second in the past (edge case)', async () => {
      const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
      const req = makeReq({ body: { eventDate: oneSecondAgo, title: 'Past Event' } });
      const res = mockRes();
      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('allows creating event with a future eventDate', async () => {
      Event.create.mockResolvedValue({ id: 1, title: 'Future Event', eventDate: nextWeek() });

      const req = makeReq({ body: { title: 'Future Event', eventDate: nextWeek(), saleStartAt: tomorrow() } });
      const res = mockRes();
      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('thành công') })
      );
    });

    it('returns 400 when saleStartAt >= eventDate', async () => {
      const date = nextWeek();
      const req = makeReq({ body: { eventDate: date, saleStartAt: date } });
      const res = mockRes();
      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('mở bán') })
      );
    });

    it('returns 400 when eventDate is missing', async () => {
      const req = makeReq({ body: { title: 'No Date' } });
      const res = mockRes();
      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateEvent — Bug #18
// ═══════════════════════════════════════════════════════════════════════════════
describe('updateEvent', () => {
  describe('#18 — saleStartAt must be before eventDate after update', () => {
    it('returns 400 when updated saleStartAt >= existing eventDate', async () => {
      const event = mockEvent({ eventDate: nextWeek(), saleStartAt: null });
      Event.findByPk.mockResolvedValue(event);

      // Try to set saleStartAt = eventDate (same day)
      const req = makeReq({ params: { id: '1' }, body: { saleStartAt: event.eventDate } });
      const res = mockRes();
      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('mở bán') })
      );
      expect(event.update).not.toHaveBeenCalled();
    });

    it('returns 400 when new eventDate < existing saleStartAt', async () => {
      const fixedTomorrow = new Date(Date.now() + 86400000).toISOString();
      const event = mockEvent({
        eventDate: nextWeek(),
        saleStartAt: fixedTomorrow,
      });
      Event.findByPk.mockResolvedValue(event);

      // Move eventDate to same value as saleStartAt → saleStartAt >= eventDate → invalid
      const req = makeReq({ params: { id: '1' }, body: { eventDate: fixedTomorrow } });
      const res = mockRes();
      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('allows valid update where saleStartAt < eventDate', async () => {
      const event = mockEvent({ eventDate: nextWeek(), saleStartAt: null });
      Event.findByPk.mockResolvedValue(event);

      const req = makeReq({ params: { id: '1' }, body: { title: 'Updated Title' } });
      const res = mockRes();
      await updateEvent(req, res);

      expect(event.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cập nhật thành công' })
      );
    });

    it('returns 404 when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      const req = makeReq({ params: { id: '999' }, body: {} });
      const res = mockRes();
      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteEvent — Bug #20
// ═══════════════════════════════════════════════════════════════════════════════
describe('deleteEvent', () => {
  describe('#20 — block delete when paid orders exist', () => {
    it('returns 409 when event has paid orders', async () => {
      Event.findByPk.mockResolvedValue(mockEvent());
      Order.count.mockResolvedValue(3); // 3 paid orders

      const req = makeReq({ params: { id: '1' } });
      const res = mockRes();
      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('3') })
      );
    });

    it('does not call destroy() when paid orders exist', async () => {
      const event = mockEvent();
      Event.findByPk.mockResolvedValue(event);
      Order.count.mockResolvedValue(1);

      const req = makeReq({ params: { id: '1' } });
      const res = mockRes();
      await deleteEvent(req, res);

      expect(event.destroy).not.toHaveBeenCalled();
    });

    it('auto-cancels pending orders before deleting', async () => {
      const event = mockEvent();
      Event.findByPk.mockResolvedValue(event);
      Order.count.mockResolvedValue(0); // no paid orders
      Order.update.mockResolvedValue([2]); // 2 pending orders cancelled

      const req = makeReq({ params: { id: '1' } });
      const res = mockRes();
      await deleteEvent(req, res);

      expect(Order.update).toHaveBeenCalledWith(
        { status: 'cancelled' },
        expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }) })
      );
      expect(event.destroy).toHaveBeenCalled();
    });

    it('allows delete when no paid orders exist', async () => {
      const event = mockEvent();
      Event.findByPk.mockResolvedValue(event);
      Order.count.mockResolvedValue(0);
      Order.update.mockResolvedValue([0]);

      const req = makeReq({ params: { id: '1' } });
      const res = mockRes();
      await deleteEvent(req, res);

      expect(event.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('thành công') })
      );
    });

    it('returns 404 when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      const req = makeReq({ params: { id: '999' } });
      const res = mockRes();
      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
