const router = require('express').Router();
const { createEvent, addSection, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { auth } = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const { validate, eventRules, sectionRules } = require('../middlewares/validator');

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', auth, admin, eventRules, validate, createEvent);
router.put('/:id', auth, admin, updateEvent);
router.delete('/:id', auth, admin, deleteEvent);
router.post('/:eventId/sections', auth, admin, sectionRules, validate, addSection);

module.exports = router;
