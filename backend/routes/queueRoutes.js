const router = require('express').Router();
const { joinQueue, getQueueStatus } = require('../controllers/queueController');
const { auth, customerOnly } = require('../middlewares/auth');

router.post('/:eventId/join', auth, customerOnly, joinQueue);
router.get('/:eventId/status', auth, customerOnly, getQueueStatus);

module.exports = router;
