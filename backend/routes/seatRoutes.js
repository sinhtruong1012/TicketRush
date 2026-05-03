const router = require('express').Router();
const { lockSeat, unlockSeat, getSeatsForEvent } = require('../controllers/seatController');
const { auth, customerOnly } = require('../middlewares/auth');
const queueGuard = require('../middlewares/queueGuard');

router.get('/event/:eventId', auth, customerOnly, queueGuard, getSeatsForEvent);
router.post('/:seatId/lock', auth, customerOnly, lockSeat);
router.post('/:seatId/unlock', auth, customerOnly, unlockSeat);

module.exports = router;
