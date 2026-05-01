const router = require('express').Router();
const { toggleFavorite, getMyFavorites, getFavoriteIds } = require('../controllers/favoriteController');
const { auth } = require('../middlewares/auth');

router.post('/toggle', auth, toggleFavorite);
router.get('/my', auth, getMyFavorites);
router.get('/ids', auth, getFavoriteIds);

module.exports = router;
