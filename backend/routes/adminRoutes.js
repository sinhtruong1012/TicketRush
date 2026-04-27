const router = require('express').Router();
const { getRealtimeDashboard, getReportStats } = require('../controllers/adminController');
const { auth } = require('../middlewares/auth');
const admin = require('../middlewares/admin');

router.get('/realtime', auth, admin, getRealtimeDashboard);
router.get('/reports', auth, admin, getReportStats);

module.exports = router;
