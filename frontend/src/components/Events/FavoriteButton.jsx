import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';
import './FavoriteButton.css';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function FavoriteButton({ eventId }) {
  const { user, favoriteIds, toggleFavoriteId, openAuthModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { msg, key }
  const isFavorite = favoriteIds.includes(eventId);

  const showToast = (msg) => {
    const key = Date.now();
    setToast({ msg, key });
    setTimeout(() => setToast(null), 2800);
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Chưa đăng nhập → mở popup login
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic UI
    const nextState = !isFavorite;
    toggleFavoriteId(eventId, nextState);

    try {
      const data = await api.toggleFavorite(eventId);
      showToast(data.message);
    } catch (err) {
      // Rollback nếu server lỗi
      toggleFavoriteId(eventId, !nextState);
      console.error('Favorite toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`fav-btn ${isFavorite ? 'fav-btn--active' : ''} ${loading ? 'fav-btn--loading' : ''}`}
        onClick={handleClick}
        title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        aria-label={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      >
        <HeartIcon filled={isFavorite} />
      </button>

      {toast && (
        <div key={toast.key} className="fav-toast" role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}
    </>
  );
}
