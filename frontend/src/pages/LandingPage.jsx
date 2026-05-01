import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { SkeletonEventCard } from '../components/Skeleton/Skeleton';
import FavoriteButton from '../components/Events/FavoriteButton';
import './LandingPage.css';

const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=80', alt: 'Concert đêm' },
  { src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=700&q=80', alt: 'Lễ hội âm nhạc' },
  { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&q=80', alt: 'Sự kiện lớn' },
  { src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=80', alt: 'Biểu diễn sân khấu' },
  { src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=700&q=80', alt: 'Đám đông concert' },
  { src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&q=80', alt: 'DJ show' },
  { src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=700&q=80', alt: 'Festival' },
  { src: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=700&q=80', alt: 'Âm nhạc sống' },
  { src: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=700&q=80', alt: 'Sự kiện thể thao' },
  { src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&q=80', alt: 'Lễ hội' },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % HERO_IMAGES.length);
  }, []);

  const goTo = (idx) => {
    setCurrent(idx);
  };

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 2500);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  return (
    <div
      className="lp-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_IMAGES.map((img, idx) => (
        <img
          key={idx}
          src={img.src}
          alt={img.alt}
          className={`lp-slide-img ${idx === current ? 'active' : ''}`}
        />
      ))}
      <div className="lp-slide-dots">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            className={`lp-dot ${idx === current ? 'active' : ''}`}
            onClick={() => goTo(idx)}
            aria-label={`Ảnh ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const CATEGORY_LABEL = {
  music: 'ÂM NHẠC',
  comedy: 'HÀI KỊCH',
  sports: 'THỂ THAO',
  theater: 'KỊCH',
  other: 'KHÁC',
};

const getMinPrice = (sections) => {
  if (!sections?.length) return null;
  return Math.min(...sections.map(s => parseFloat(s.price)));
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const EventCard = ({ event, index, isPortrait, isTrending }) => {
  const minPrice = getMinPrice(event.sections);
  const cardClasses = `lp-c-card ${isPortrait ? 'portrait' : 'landscape'} ${isTrending ? 'trending' : ''}`;
  const dateStr = formatDate(event.eventDate).split(',')[1] || formatDate(event.eventDate);

  return (
    <Link to={`/events/${event.id}`} className={cardClasses} style={{ animationDelay: `${index * 0.1}s` }}>
      {isTrending && <div className="lp-c-number">{index + 1}</div>}
      <div className="lp-c-img-wrap">
        <FavoriteButton eventId={event.id} />
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={event.title} loading="lazy" />
        ) : (
          <div className="lp-c-img-placeholder" style={{ background: `linear-gradient(135deg, ${event.sections?.[0]?.colorCode || '#e53e3e'}33, #f7f7f7)` }} />
        )}
      </div>
      <div className="lp-c-body">
        <h3 className="lp-c-title">{event.title}</h3>
        <div className="lp-c-meta">
          {minPrice !== null && <span className="lp-c-price">Từ {formatCurrency(minPrice)}</span>}
          <span className="lp-c-date">
            <CalendarIcon />
            {dateStr}
          </span>
        </div>
      </div>
    </Link>
  );
};



const EventCarousel = ({ title, events, loading = false, isPortrait = false, isTrending = false, tabs = null, activeTab = null, onTabChange = null, hideMoreLink = false }) => {
  const scrollRef = useRef(null);
  const scroll = (offset) => scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });

  if (!loading && !events?.length) return null;

  return (
    <section className="lp-carousel-section">
      <div className="container">
        <div className="lp-carousel-header">
          {tabs ? (
            <div className="lp-tabs">
              {tabs.map(t => (
                <button key={t} className={`lp-tab ${activeTab === t ? 'active' : ''}`} onClick={() => onTabChange(t)}>{t}</button>
              ))}
            </div>
          ) : (
            <h2 className="lp-carousel-title">{title}</h2>
          )}
          {!hideMoreLink && <Link to="/events" className="lp-carousel-more">Xem thêm &gt;&gt;</Link>}
        </div>

        <div className="lp-carousel-body">
          <button className="lp-btn-nav left" onClick={() => scroll(-400)}>&lt;</button>
          <div className="lp-carousel-track" ref={scrollRef}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`lp-c-card ${isPortrait ? 'portrait' : 'landscape'}`}>
                  <SkeletonEventCard />
                </div>
              ))
            ) : (
              events.map((event, index) => (
                <EventCard key={`${event.id}-${index}`} event={event} index={index} isPortrait={isPortrait} isTrending={isTrending} />
              ))
            )}
          </div>
          <button className="lp-btn-nav right" onClick={() => scroll(400)}>&gt;</button>
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy tối đa 50 sự kiện để làm data pool cho trang chủ
    api.getEvents('limit=50&status=published').then(data => {
      setAllEvents(data.events || []);
    }).catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const categorySections = [
    { title: 'Âm nhạc', category: 'music' },
    { title: 'Hài kịch', category: 'comedy' },
    { title: 'Kịch & Sân khấu', category: 'theater' },
    { title: 'Thể thao', category: 'sports' },
    { title: 'Khác', category: 'other' },
  ];

  return (
    <div className="landing">
      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner container">
          <div className="lp-hero-text">
            <p className="lp-eyebrow anim-entrance">Nhiều điều thú vị đang chờ đón bạn</p>
            <h1 className="lp-hero-title anim-entrance anim-delay-1">Chào mừng đến với <strong style={{ color: '#e53e3e' }}>TicketRush</strong></h1>
            <p className="lp-hero-desc anim-entrance anim-delay-2">
              TicketRush là nền tảng bán vé trực tuyến hàng đầu Việt Nam. Với sức mạnh công nghệ, kinh nghiệm và sự thấu hiểu thị trường cùng một hệ sinh thái người dùng rộng lớn, TicketRush là lựa chọn hoàn hảo cho khách hàng và bất kì nhà tổ chức sự kiện nào.
            </p>
            <div className="lp-hero-actions anim-entrance anim-delay-3">
              <Link to="/events" className="lp-btn-outline">Khám phá sự kiện</Link>
            </div>
          </div>
          <div className="lp-hero-visual anim-entrance anim-delay-2">
            <div className="lp-hero-img-wrap">
              <HeroSlideshow />
            </div>
          </div>
        </div>
      </section>

      <div className="lp-carousels-wrapper">
        <EventCarousel title="Sự kiện đặc biệt" events={allEvents.slice(0, 8)} loading={loading} isPortrait hideMoreLink />
        <EventCarousel title="🔥 Sự kiện xu hướng" events={shuffleArray(allEvents).slice(0, 10)} loading={loading} isTrending hideMoreLink />

        {categorySections.map(({ title, category }) => (
          <EventCarousel
            key={category}
            title={title}
            events={allEvents.filter(e => e.category === category).slice(0, 8)}
            loading={loading}
          />
        ))}
      </div>


    </div>
  );
}
