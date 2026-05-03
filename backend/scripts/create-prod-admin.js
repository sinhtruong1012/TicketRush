/**
 * Script tạo tài khoản Admin trên Production DB
 * Chạy: DATABASE_URL="<paste url here>" node scripts/create-prod-admin.js
 */
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Thiếu DATABASE_URL. Chạy lại với:');
  console.error('   $env:DATABASE_URL="postgresql://..." ; node backend/scripts/create-prod-admin.js');
  process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

const User = sequelize.define('User', {
  email: DataTypes.STRING,
  passwordHash: DataTypes.STRING,
  fullName: DataTypes.STRING,
  phone: DataTypes.STRING,
  gender: DataTypes.STRING,
  birthDate: DataTypes.DATEONLY,
  role: DataTypes.STRING,
}, { tableName: 'Users' });

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');

    // Ensure tables exist before querying
    await sequelize.sync();
    console.log('✅ Bảng đã được đồng bộ!');

    const existing = await User.findOne({ where: { email: 'admin@ticketrush.vn' } });
    if (existing) {
      console.log('⚠️  Admin đã tồn tại rồi! Email: admin@ticketrush.vn');
      process.exit(0);
    }

    const hash = await bcrypt.hash('Admin@123456', 12);
    await User.create({
      email: 'admin@ticketrush.vn',
      passwordHash: hash,
      fullName: 'Admin TicketRush',
      phone: '0901234567',
      gender: 'male',
      birthDate: '1990-01-15',
      role: 'admin',
    });

    console.log('✅ Tạo admin thành công!');
    console.log('   Email   : admin@ticketrush.vn');
    console.log('   Password: Admin@123456');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

run();
