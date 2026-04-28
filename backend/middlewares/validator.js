const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ hoa')
    .matches(/[a-z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ thường')
    .matches(/[0-9]/).withMessage('Mật khẩu phải có ít nhất 1 chữ số')
    .matches(/[^A-Za-z0-9]/).withMessage('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...)'),
  body('fullName').notEmpty().withMessage('Họ tên không được để trống'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];

const eventRules = [
  body('title').notEmpty().withMessage('Tên sự kiện không được để trống'),
  body('venueName').notEmpty().withMessage('Tên địa điểm không được để trống'),
  body('eventDate').isISO8601().withMessage('Ngày sự kiện không hợp lệ'),
];

const sectionRules = [
  body('name').notEmpty().withMessage('Tên khu vực không được để trống'),
  body('rowsCount').isInt({ min: 1, max: 50 }).withMessage('Số hàng phải từ 1-50'),
  body('seatsPerRow').isInt({ min: 1, max: 50 }).withMessage('Số ghế/hàng phải từ 1-50'),
  body('price').isFloat({ min: 0 }).withMessage('Giá phải >= 0'),
];

module.exports = { validate, registerRules, loginRules, eventRules, sectionRules };
