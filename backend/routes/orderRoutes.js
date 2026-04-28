const router = require('express').Router();
const { createOrder, confirmOrder, cancelOrder, getMyTickets, getOrderById, checkInTicket } = require('../controllers/orderController');
const { auth, customerOnly, adminOnly } = require('../middlewares/auth');

router.post('/create', auth, customerOnly, createOrder);
router.post('/:id/confirm', auth, customerOnly, confirmOrder);
router.post('/:id/cancel', auth, customerOnly, cancelOrder); // [FIX 14]
router.post('/items/:itemId/checkin', auth, adminOnly, checkInTicket); // [FIX 21] QR scan check-in
router.get('/my-tickets', auth, customerOnly, getMyTickets);
router.get('/:id', auth, customerOnly, getOrderById);

module.exports = router;
