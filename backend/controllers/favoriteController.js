const { Favorite, Event, SeatSection } = require('../models');

// Toggle: thêm nếu chưa có, xóa nếu đã có
const toggleFavorite = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ error: true, message: 'eventId là bắt buộc' });
    }

    const existing = await Favorite.findOne({ where: { userId, eventId } });

    if (existing) {
      await existing.destroy();
      return res.json({ isFavorite: false, message: 'Đã xóa khỏi sự kiện quan tâm' });
    }

    await Favorite.create({ userId, eventId });
    res.json({ isFavorite: true, message: 'Đã thêm vào sự kiện quan tâm' });
  } catch (error) {
    console.error('toggleFavorite error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

// Lấy danh sách sự kiện đầy đủ (dùng cho trang /favorites)
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Event,
        as: 'event',
        include: [{ model: SeatSection, as: 'sections', attributes: ['price', 'colorCode'] }],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ favorites: favorites.map(f => f.event).filter(Boolean) });
  } catch (error) {
    console.error('getMyFavorites error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

// Chỉ lấy mảng ID (dùng để đồng bộ icon trái tim nhanh)
const getFavoriteIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.findAll({
      where: { userId },
      attributes: ['eventId'],
    });
    res.json({ ids: favorites.map(f => f.eventId) });
  } catch (error) {
    console.error('getFavoriteIds error:', error);
    res.status(500).json({ error: true, message: 'Lỗi server' });
  }
};

module.exports = { toggleFavorite, getMyFavorites, getFavoriteIds };
