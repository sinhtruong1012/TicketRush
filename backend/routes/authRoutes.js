const router = require('express').Router();
const { register, login, getMe, updateProfile, logout } = require('../controllers/authController');
const { auth } = require('../middlewares/auth');
const { validate, registerRules, loginRules } = require('../middlewares/validator');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter'); // [FIX 1.3]
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
  }
});

router.post('/register', registerLimiter, registerRules, validate, register); // [FIX 1.3]
router.post('/login', loginLimiter, loginRules, validate, login);             // [FIX 1.3]
router.get('/me', auth, getMe);
router.put('/profile', auth, upload.single('avatarFile'), updateProfile);
router.post('/logout', auth, logout);

module.exports = router;

