import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import FavoriteButton from '../components/Events/FavoriteButton';
import './MyFavoritesPage.css';

const getMinPrice = (sections) => {
  if (!sections?.length) return null;
  return Math.min(...sections.map(s => parseFloat(s.price)));
};

const CATEGORY_LABEL = {
  music: 'Âm nhạc', comedy: 'Hài kịch',
  sports: 'Thể thao', theater: 'Kịch & Sân khấu', other: 'Khác',
};

export default function MyFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favoriteIds } = useAuth();

  useEffect(() => {
    api.getMyFavorites()
      .then(data => setFavorites(data.favorites || []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  // Khi người dùng bỏ tim một sự kiện → xóa khỏi danh sách
  useEffect(() => {
    setFavorites(prev => prev.filter(e => favoriteIds.includes(e.id)));
  }, [favoriteIds]);

  if (loading) {
    return (
      <div className="mfp-page container">
        <div className="mfp-header">
          <h1 className="mfp-title">Sự kiện quan tâm</h1>
        </div>
        <div className="mfp-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mfp-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <div className="mfp-page container">
        <div className="mfp-header">
          <h1 className="mfp-title">Sự kiện quan tâm</h1>
          <p className="mfp-subtitle">Danh sách các sự kiện bạn đã lưu để theo dõi</p>
        </div>
        <div className="mfp-empty">
          <div className="mfp-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2>Chưa có sự kiện nào</h2>
          <p>Hãy khám phá và nhấn vào ❤️ trên các sự kiện bạn yêu thích để lưu lại nhé!</p>
          <Link to="/" className="mfp-explore-btn">Khám phá ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mfp-page container">
      <div className="mfp-header">
        <h1 className="mfp-title">Sự kiện quan tâm</h1>
        <p className="mfp-subtitle">{favorites.length} sự kiện đã lưu</p>
      </div>
      <div className="mfp-grid">
        {favorites.map(event => {
          const minPrice = getMinPrice(event.sections);
          return (
            <div key={event.id} className="mfp-card-wrap">
              <Link to={`/events/${event.id}`} className="mfp-card">
                <div className="mfp-card-img">
                  <FavoriteButton eventId={event.id} />
                  {event.posterUrl
                    ? <img src={event.posterUrl} alt={event.title} loading="lazy" />
                    : <div className="mfp-img-placeholder" style={{ background: `linear-gradient(135deg, ${event.sections?.[0]?.colorCode || '#e53e3e'}22, #f1f5f9)` }} />
                  }
                </div>
                <div className="mfp-card-body">
                  <span className="mfp-category">{CATEGORY_LABEL[event.category] || event.category}</span>
                  <h3 className="mfp-card-title">{event.title}</h3>
                  <div className="mfp-card-meta">
                    <span className="mfp-card-date">{formatDate(event.eventDate)}</span>
                    {minPrice !== null && (
                      <span className="mfp-card-price">Từ {formatCurrency(minPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
