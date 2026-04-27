/**
 * Migration: Add qr_code_data column to order_items
 * + Backfill QR codes for all existing paid orders
 *
 * Run: node backend/scripts/migrate-qr-per-seat.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const QRCode = require('qrcode');
const sequelize = require('../config/database');
const { Order, OrderItem, Seat, SeatSection } = require('../models');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();
  const tableDesc = await queryInterface.describeTable('order_items');

  if (!tableDesc.qr_code_data) {
    console.log('[1/3] Adding qr_code_data column to order_items...');
    await queryInterface.addColumn('order_items', 'qr_code_data', {
      type: require('sequelize').DataTypes.TEXT,
      allowNull: true,
    });
    console.log('      ✅ Column added.');
  } else {
    console.log('[1/3] Column qr_code_data already exists, skipping.');
  }
}

async function backfill() {
  console.log('[2/3] Loading all paid orders for backfill...');

  const orders = await Order.findAll({
    where: { status: 'paid' },
    include: [{
      model: OrderItem,
      as: 'items',
      include: [{ model: Seat, as: 'seat', include: [{ model: SeatSection, as: 'section' }] }],
    }],
  });

  console.log(`      Found ${orders.length} paid order(s).`);
  let totalItems = 0;

  for (const order of orders) {
    for (const item of order.items) {
      if (item.qrCodeData) continue; // already has QR

      const seat = item.seat;
      const section = seat?.section;

      const qrData = JSON.stringify({
        orderId: order.id,
        itemId: item.id,
        seatId: seat.id,
        section: section?.name ?? '',
        seat: `${seat.rowLabel}${seat.seatNumber}`,
        eventId: order.eventId,
      });

      const qrImage = await QRCode.toDataURL(qrData);
      await item.update({ qrCodeData: qrImage });
      totalItems++;
    }
  }

  console.log(`      ✅ Backfilled ${totalItems} item(s).`);
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.\n');

    await migrate();
    await backfill();

    console.log('\n[3/3] ✅ Migration & backfill complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
