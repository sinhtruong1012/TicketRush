const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../controllers/authController');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Token không hợp lệ' });
    }

    const token = authHeader.split(' ')[1];

    // [FIX 1.1] Reject blacklisted (logged-out) tokens
    if (isBlacklisted(token)) {
      return res.status(401).json({ error: true, message: 'Token đã bị thu hồi. Vui lòng đăng nhập lại.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: 'Token hết hạn hoặc không hợp lệ' });
  }
};

// Middleware: chỉ cho phép customer (role !== 'admin') thực hiện thao tác đặt vé
const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return res.status(403).json({
      error: true,
      message: 'Admin không được phép thực hiện thao tác đặt vé.',
    });
  }
  next();
};

// Middleware: chỉ cho phép admin thực hiện (e.g. check-in QR scan)
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: true,
      message: 'Chỉ admin mới có quyền thực hiện thao tác này.',
    });
  }
  next();
};

module.exports = { auth, customerOnly, adminOnly };
