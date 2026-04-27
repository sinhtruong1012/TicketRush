const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: true, message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

module.exports = admin;
