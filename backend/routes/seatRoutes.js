const router = require('express').Router();
const { lockSeat, unlockSeat, getSeatsForEvent } = require('../controllers/seatController');
const { auth, customerOnly } = require('../middlewares/auth');

router.get('/event/:eventId', getSeatsForEvent);
router.post('/:seatId/lock', auth, customerOnly, lockSeat);
router.post('/:seatId/unlock', auth, customerOnly, unlockSeat);

module.exports = router;
