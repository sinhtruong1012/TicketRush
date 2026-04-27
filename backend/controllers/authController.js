const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, gender, birthDate } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: true, message: 'Email đã được sử dụng' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      fullName,
      phone,
      gender,
      birthDate,
      role: 'customer',
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: true, message: 'Email hoặc mật khẩu không đúng' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: true, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User không tồn tại' });
    }
    res.json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, gender, birthDate } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'User không tồn tại' });
    }

    await user.update({
      fullName: fullName !== undefined ? fullName : user.fullName,
      phone: phone !== undefined ? phone : user.phone,
      gender: gender !== undefined ? gender : user.gender,
      birthDate: birthDate !== undefined ? birthDate : user.birthDate,
      avatar: req.file ? `/uploads/${req.file.filename}` : user.avatar,
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { register, login, getMe, updateProfile };
