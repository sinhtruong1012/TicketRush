const { Op, fn, col, literal } = require('sequelize');
const { User, Event, Order, OrderItem, Seat, SeatSection } = require('../models');
const sequelize = require('../config/database');

const getRealtimeDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalRevenue = await Order.sum('total_amount', { where: { status: 'paid' } }) || 0;
    
    const ticketsSoldToday = await OrderItem.count({
      include: [{ 
        model: Order, 
        as: 'order', 
        where: { status: 'paid', paidAt: { [Op.gte]: today } }, 
        attributes: [] 
      }],
    });
    
    const activeEvents = await Event.count({ where: { status: 'published' } });

    const revenueByDate = await Order.findAll({
      where: {
        status: 'paid',
        paidAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      attributes: [
        [fn('DATE', col('paid_at')), 'date'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('id')), 'orders'],
      ],
      group: [fn('DATE', col('paid_at'))],
      order: [[fn('DATE', col('paid_at')), 'ASC']],
      raw: true,
    });

    const events = await Event.findAll({
      where: { status: 'published' },
      include: [{
        model: SeatSection,
        as: 'sections',
        attributes: ['id', 'name'],
        include: [{
          model: Seat,
          as: 'seats',
          attributes: ['status'],
        }],
      }],
    });

    const seatFillRate = events.map(event => {
      const allSeats = event.sections.flatMap(s => s.seats);
      const total = allSeats.length;
      const sold = allSeats.filter(s => s.status === 'sold').length;
      const locked = allSeats.filter(s => s.status === 'locked').length;
      return {
        eventId: event.id,
        title: event.title,
        total,
        sold,
        locked,
        available: total - sold - locked,
        fillRate: total > 0 ? Math.round((sold / total) * 100) : 0,
      };
    });

    const recentTransactions = await Order.findAll({
      where: { status: 'paid' },
      order: [['paidAt', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'user', attributes: ['fullName', 'email', 'avatar'] }]
    });

    res.json({
      summary: { totalRevenue, ticketsSoldToday, activeEvents },
      revenueByDate,
      seatFillRate,
      recentTransactions,
    });
  } catch (error) {
    console.error('GetRealtimeDashboard error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

const getReportStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let userDateFilter = {};
    if (startDate && endDate) {
      userDateFilter = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')]
        }
      };
    }

    const totalAudience = await User.count({ where: { role: 'customer' } });
    
    let newMembersFilter = userDateFilter;
    if (!startDate) {
      newMembersFilter = {
        createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      };
    }
    const newMembers = await User.count({ where: { role: 'customer', ...newMembersFilter } });

    const usersWithOrders = await Order.count({
      where: { status: 'paid' },
      distinct: true,
      col: 'userId'
    });
    const interactionRate = totalAudience > 0 ? ((usersWithOrders / totalAudience) * 100).toFixed(1) : 0;

    const genderStatsRaw = await User.findAll({
      where: { role: 'customer', gender: { [Op.not]: null }, ...userDateFilter },
      attributes: ['gender', [fn('COUNT', col('id')), 'count']],
      group: ['gender'],
      raw: true,
    });
    const genderStats = genderStatsRaw.map(r => ({ gender: r.gender, count: parseInt(r.count, 10) }));

    let ageQueryWhere = "role = 'customer' AND birth_date IS NOT NULL";
    if (startDate && endDate) {
      ageQueryWhere += ` AND created_at BETWEEN '${startDate}' AND '${endDate} 23:59:59'`;
    }
    const ageStats = await sequelize.query(`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) <= 17 THEN '0 - 17 tuổi'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 30 THEN '18 - 30 tuổi'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 31 AND 45 THEN '30 - 45 tuổi'
          ELSE '45+ tuổi'
        END AS age_group,
        COUNT(*) AS count
      FROM users
      WHERE ${ageQueryWhere}
      GROUP BY age_group
      ORDER BY age_group
    `, { type: sequelize.QueryTypes.SELECT });

    const newAudiences = await User.findAll({
      where: { role: 'customer' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'fullName', 'email', 'avatar', 'createdAt']
    });

    res.json({
      summary: { totalAudience, newMembers, interactionRate },
      demographics: { genderStats, ageStats },
      newAudiences,
    });
  } catch (error) {
    console.error('GetReportStats error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { getRealtimeDashboard, getReportStats };
