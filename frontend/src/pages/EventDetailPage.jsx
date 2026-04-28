import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { SkeletonEventDetail } from '../components/Skeleton/Skeleton';
import './EventDetailPage.css';

const CATEGORY_LABEL = {
  music: 'ÂM NHẠC',
  comedy: 'HÀI KỊCH',
  sports: 'THỂ THAO',
  theater: 'KỊCH',
  other: 'KHÁC',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [ticketExpanded, setTicketExpanded] = useState(true);

  useEffect(() => {
    api.getEvent(id)
      .then(data => setEvent(data.event))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container"><SkeletonEventDetail /></div>;
  if (!event) return <div className="empty-state">Sự kiện không tồn tại</div>;

  const minPrice = event.sections?.length > 0
    ? Math.min(...event.sections.map(s => parseFloat(s.price)))
    : null;

  const totalSeats = event.sections?.reduce((sum, s) => sum + s.seats.length, 0) || 0;
  const soldSeats = event.sections?.reduce((sum, s) => sum + s.seats.filter(seat => seat.status === 'sold').length, 0) || 0;
  const availableSeats = totalSeats - soldSeats;

  const hasPoster = !!event.posterUrl;

  return (
    <div className="ed-page">

      {/* ── HERO ── */}
      <section className="ed-hero">
        <div className="container ed-hero-inner">
          {/* Left: info */}
          <div className="ed-hero-info anim-entrance">
            <span className="ed-category">{CATEGORY_LABEL[event.category] ?? event.category}</span>
            <h1 className="ed-title">{event.title}</h1>

            <div className="ed-meta-list">
              <div className="ed-meta-item">
                <svg className="ed-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{formatDate(event.eventDate)}</span>
              </div>
              <div className="ed-meta-item">
                <svg className="ed-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <span className="ed-venue-name">{event.venueName}</span>
                  {event.venueAddress && <span className="ed-venue-addr">{event.venueAddress}</span>}
                </div>
              </div>
            </div>

            {minPrice !== null && (
              <p className="ed-price-from">
                Giá từ <strong>{formatCurrency(minPrice)}</strong>
              </p>
            )}

            {!isAdmin && (
              <Link to={`/events/${id}/seats`} className="ed-btn-book">
                Mua vé ngay
              </Link>
            )}
          </div>

          {/* Right: poster */}
          <div className="ed-hero-poster anim-entrance anim-delay-1">
            {hasPoster ? (
              <img src={event.posterUrl} alt={event.title} className="ed-poster-img" />
            ) : (
              <div
                className="ed-poster-placeholder"
                style={{ background: `linear-gradient(135deg, ${event.sections?.[0]?.colorCode || '#e53e3e'}33, #f0f0f0)` }}
              >
                <span className="ed-poster-icon">🎭</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="container ed-body">

        {/* Giới thiệu */}
        {event.description && (
          <div className="ed-section-card anim-entrance anim-delay-2">
            <button
              className="ed-accordion-header"
              onClick={() => setDescExpanded(v => !v)}
              aria-expanded={descExpanded}
            >
              <span className="ed-accordion-title">Giới thiệu</span>
              <svg
                className={`ed-accordion-arrow ${descExpanded ? 'open' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={`ed-accordion-body ${descExpanded ? 'open' : ''}`}>
              <p className="ed-description">{event.description}</p>
            </div>
          </div>
        )}

        {/* Lịch diễn & Thông tin vé */}
        <div className="ed-section-card anim-entrance anim-delay-3">
          <button
            className="ed-accordion-header"
            onClick={() => setTicketExpanded(v => !v)}
            aria-expanded={ticketExpanded}
          >
            <span className="ed-accordion-title">Lịch diễn</span>
            <svg
              className={`ed-accordion-arrow ${ticketExpanded ? 'open' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className={`ed-accordion-body ${ticketExpanded ? 'open' : ''}`}>
            <div className="ed-schedule-row">
              <span className="ed-schedule-time">{formatDate(event.eventDate)}</span>
              {!isAdmin && (
                <Link to={`/events/${id}/seats`} className="ed-btn-book ed-btn-book--sm">
                  Mua vé ngay
                </Link>
              )}
            </div>

            {event.sections?.length > 0 && (
              <>
                <p className="ed-ticket-subtitle">Thông tin vé</p>
                <div className="ed-ticket-list">
                  {event.sections.map(section => (
                    <div key={section.id} className="ed-ticket-row">
                      <span className="ed-ticket-arrow">›</span>
                      <span className="ed-ticket-name">{section.name}</span>
                      <span className="ed-ticket-price">{formatCurrency(section.price)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Khu vực ghế */}
        {event.sections?.length > 0 && (
          <div className="ed-section-card anim-entrance anim-delay-4">
            <h2 className="ed-section-title">Khu vực ghế</h2>
            <div className="ed-seats-grid">
              {event.sections.map(section => {
                const sectionAvailable = section.seats.filter(s => s.status === 'available').length;
                const sectionTotal = section.seats.length;
                return (
                  <div key={section.id} className="ed-seat-card">
                    <div className="ed-seat-bar" style={{ background: section.colorCode }} />
                    <h3 className="ed-seat-name">{section.name}</h3>
                    <p className="ed-seat-price">{formatCurrency(section.price)}</p>
                    <p className="ed-seat-count">{sectionAvailable} / {sectionTotal} ghế trống</p>
                  </div>
                );
              })}
            </div>

            {/* Overall availability */}
            <div className="ed-avail-bar-wrap">
              <div className="ed-avail-labels">
                <span>Còn trống: <strong style={{ color: '#16a34a' }}>{availableSeats}</strong></span>
                <span>Đã bán: <strong style={{ color: '#dc2626' }}>{soldSeats}</strong></span>
                <span>Tổng: <strong>{totalSeats}</strong></span>
              </div>
              <div className="ed-avail-bar">
                <div
                  className="ed-avail-bar-fill"
                  style={{ width: totalSeats > 0 ? `${(soldSeats / totalSeats) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
