require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User, Event, SeatSection, Seat } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // Admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    await User.create({
      email: 'admin@ticketrush.vn',
      passwordHash: adminHash,
      fullName: 'Admin TicketRush',
      phone: '0901234567',
      gender: 'male',
      birthDate: '1990-01-15',
      role: 'admin',
    });

    // Sample customers
    const customerHash = await bcrypt.hash('user123', 12);
    await User.bulkCreate([
      { email: 'user1@gmail.com', passwordHash: customerHash, fullName: 'Nguyễn Văn A', phone: '0912345678', gender: 'male', birthDate: '2000-05-20', role: 'customer' },
      { email: 'user2@gmail.com', passwordHash: customerHash, fullName: 'Trần Thị B', phone: '0923456789', gender: 'female', birthDate: '1998-08-10', role: 'customer' },
      { email: 'user3@gmail.com', passwordHash: customerHash, fullName: 'Lê Văn C', phone: '0934567890', gender: 'male', birthDate: '2002-03-25', role: 'customer' },
    ]);

    // Event 1
    const event1 = await Event.create({
      title: 'Đại nhạc hội Sơn Tùng M-TP - The Sky Tour 2026',
      description: 'Show diễn hoành tráng nhất năm 2026 với sân khấu LED khổng lồ và hệ thống âm thanh đỉnh cao. Sơn Tùng M-TP cùng dàn khách mời đặc biệt.',
      category: 'music',
      venueName: 'Sân vận động Mỹ Đình',
      venueAddress: 'Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội',
      eventDate: '2026-06-15T19:00:00+07:00',
      saleStartAt: '2026-05-01T09:00:00+07:00',
      posterUrl: '/assets/posters/event1.jpg',
      status: 'published',
    });

    // Sections for Event 1
    const sections1 = [
      { eventId: event1.id, name: 'VIP-A', rowsCount: 5, seatsPerRow: 12, price: 2500000, colorCode: '#FFD700' },
      { eventId: event1.id, name: 'VIP-B', rowsCount: 5, seatsPerRow: 15, price: 1800000, colorCode: '#FF6B6B' },
      { eventId: event1.id, name: 'Standard', rowsCount: 10, seatsPerRow: 20, price: 800000, colorCode: '#00D4FF' },
    ];

    for (const sectionData of sections1) {
      const section = await SeatSection.create(sectionData);
      const seats = [];
      for (let row = 0; row < sectionData.rowsCount; row++) {
        const rowLabel = String.fromCharCode(65 + row);
        for (let seatNum = 1; seatNum <= sectionData.seatsPerRow; seatNum++) {
          seats.push({ sectionId: section.id, rowLabel, seatNumber: seatNum, status: 'available', version: 0 });
        }
      }
      await Seat.bulkCreate(seats);
    }

    // Event 2
    const event2 = await Event.create({
      title: 'Liveshow Mỹ Tâm - Tri Ân 2026',
      description: 'Liveshow đặc biệt kỷ niệm 20 năm ca hát của Mỹ Tâm. Một đêm nhạc đầy cảm xúc với những bản hit đi cùng năm tháng.',
      category: 'music',
      venueName: 'Nhà hát Hòa Bình',
      venueAddress: '240 Đường 3/2, Quận 10, TP.HCM',
      eventDate: '2026-07-20T20:00:00+07:00',
      saleStartAt: '2026-06-01T09:00:00+07:00',
      posterUrl: '/assets/posters/event2.jpg',
      status: 'published',
    });

    const sections2 = [
      { eventId: event2.id, name: 'Diamond', rowsCount: 3, seatsPerRow: 10, price: 3500000, colorCode: '#E0BBE4' },
      { eventId: event2.id, name: 'Gold', rowsCount: 5, seatsPerRow: 12, price: 2000000, colorCode: '#FFD700' },
      { eventId: event2.id, name: 'Silver', rowsCount: 8, seatsPerRow: 15, price: 1000000, colorCode: '#C0C0C0' },
    ];

    for (const sectionData of sections2) {
      const section = await SeatSection.create(sectionData);
      const seats = [];
      for (let row = 0; row < sectionData.rowsCount; row++) {
        const rowLabel = String.fromCharCode(65 + row);
        for (let seatNum = 1; seatNum <= sectionData.seatsPerRow; seatNum++) {
          seats.push({ sectionId: section.id, rowLabel, seatNumber: seatNum, status: 'available', version: 0 });
        }
      }
      await Seat.bulkCreate(seats);
    }

    console.log('✅ Seed data created successfully');
    console.log('👤 Admin: admin@ticketrush.vn / admin123');
    console.log('👤 Users: user1@gmail.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
