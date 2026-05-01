import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { SkeletonEventGrid } from '../components/Skeleton/Skeleton';
import FavoriteButton from '../components/Events/FavoriteButton';
import './EventsPage.css';

/* ── Constants ── */
const CITIES = [
  { value: 'all', label: 'Toàn quốc' },
  { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Lạt', label: 'Đà Lạt' },
  { value: 'other', label: 'Vị trí khác' },
];

const CATEGORIES = [
  { value: '', label: 'Tất cả' },
  { value: 'music', label: 'Âm nhạc' },
  { value: 'theater', label: 'Kịch' },
  { value: 'sports', label: 'Thể thao' },
  { value: 'comedy', label: 'Hài kịch' },
  { value: 'other', label: 'Khác' },
];

const PRICE_RANGES = [
  { value: '', label: 'Tất cả', min: null, max: null },
  { value: 'under500', label: 'Dưới 500k', min: 0, max: 500000 },
  { value: '500to2m', label: '500k – 2 Triệu', min: 500000, max: 2000000 },
  { value: 'over2m', label: 'Trên 2 Triệu', min: 2000001, max: null },
];

const DATE_PRESETS = [
  { value: 'all', label: 'Tất cả các ngày' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'tomorrow', label: 'Ngày mai' },
  { value: 'weekend', label: 'Cuối tuần này' },
  { value: 'month', label: 'Tháng này' },
];

/* ── Date helpers ── */
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a, b) => a && b && toISO(a) === toISO(b);
const isBetween = (d, start, end) => d >= start && d <= end;

function presetToRange(preset) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'tomorrow') {
    const t = new Date(today); t.setDate(t.getDate() + 1);
    return { from: t, to: t };
  }
  if (preset === 'weekend') {
    const day = today.getDay();
    const sat = new Date(today); sat.setDate(today.getDate() + ((6 - day + 7) % 7 || 7));
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    return { from: sat, to: sun };
  }
  if (preset === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: first, to: last };
  }
  return { from: null, to: null };
}

/* ══════════════════════════════════════════
   DateFilterDropdown
══════════════════════════════════════════ */
function DateFilterDropdown({ value, onApply, onClose }) {
  const [preset, setPreset] = useState(value.preset || 'all');
  const [selecting, setSelecting] = useState(null); // 'from' | 'to'
  const [from, setFrom] = useState(value.from || null);
  const [to, setTo] = useState(value.to || null);
  const [hover, setHover] = useState(null);

  // Show 2 consecutive months (current + next)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const months = [
    { month: viewMonth, year: viewYear },
    { month: (viewMonth + 1) % 12, year: viewMonth === 11 ? viewYear + 1 : viewYear },
  ];

  const MONTH_NAMES = ['Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const DAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const selectPreset = (p) => {
    setPreset(p);
    const { from: f, to: t } = presetToRange(p);
    setFrom(f); setTo(t);
    setSelecting(null);
  };

  const handleDayClick = (d) => {
    if (!selecting || selecting === 'from') {
      setFrom(d); setTo(null); setSelecting('to'); setPreset('custom');
    } else {
      if (d < from) { setFrom(d); setTo(from); }
      else { setTo(d); }
      setSelecting(null); setPreset('custom');
    }
  };

  const buildDays = ({ month, year }) => {
    const first = new Date(year, month, 1);
    const dayOfWeek = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < dayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  };

  const isInRange = (d) => {
    if (!d) return false;
    const end = to || hover;
    if (!from || !end) return false;
    const [s, e] = from <= end ? [from, end] : [end, from];
    return isBetween(d, s, e);
  };

  const reset = () => { setPreset('all'); setFrom(null); setTo(null); setSelecting(null); };

  const apply = () => {
    onApply({ preset, from, to });
    onClose();
  };

  return (
    <div className="filter-dropdown date-dropdown">
      {/* Quick presets */}
      <div className="date-presets">
        {DATE_PRESETS.map(p => (
          <button key={p.value} className={`date-preset-btn${preset === p.value ? ' active' : ''}`}
            onClick={() => selectPreset(p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Calendar navigation */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
          else setViewMonth(m => m - 1);
        }}>‹</button>
        <div className="cal-months">
          {months.map(({ month, year }) => {
            const cells = buildDays({ month, year });
            return (
              <div key={`${year}-${month}`} className="cal-month">
                <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
                <div className="cal-grid">
                  {DAY_HEADERS.map(h => <span key={h} className="cal-header">{h}</span>)}
                  {cells.map((d, i) => {
                    if (!d) return <span key={`e-${i}`} />;
                    const isFrom = sameDay(d, from);
                    const isTo = sameDay(d, to || hover);
                    const inRange = isInRange(d);
                    const isPast = d < today;
                    return (
                      <button
                        key={d.toISOString()}
                        className={`cal-day${isFrom ? ' cal-from' : ''}${isTo && to ? ' cal-to' : ''}${inRange && !isFrom && !isTo ? ' cal-range' : ''}${isPast ? ' cal-past' : ''}`}
                        onClick={() => !isPast && handleDayClick(d)}
                        onMouseEnter={() => selecting === 'to' && setHover(d)}
                        onMouseLeave={() => setHover(null)}
                        disabled={isPast}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <button className="cal-nav-btn" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
          else setViewMonth(m => m + 1);
        }}>›</button>
      </div>

      <div className="filter-footer">
        <button className="filter-reset-btn" onClick={reset}>Thiết lập lại</button>
        <button className="filter-apply-btn" onClick={apply}>Áp dụng</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   AdvancedFilterDropdown
══════════════════════════════════════════ */
function AdvancedFilterDropdown({ value, onApply, onClose }) {
  const [city, setCity] = useState(value.city || 'all');
  const [priceRange, setPriceRange] = useState(value.priceRange || '');
  const [category, setCategory] = useState(value.category || '');

  const reset = () => { setCity('all'); setPriceRange(''); setCategory(''); };
  const apply = () => { onApply({ city, priceRange, category }); onClose(); };

  return (
    <div className="filter-dropdown advanced-dropdown">
      {/* Vị trí */}
      <div className="adv-section">
        <p className="adv-label">Vị trí</p>
        {CITIES.map(c => (
          <label key={c.value} className="adv-radio-row">
            <input type="radio" name="city" value={c.value} checked={city === c.value}
              onChange={() => setCity(c.value)} />
            <span className={`adv-radio-dot${city === c.value ? ' checked' : ''}`} />
            {c.label}
          </label>
        ))}
      </div>

      <hr className="adv-divider" />

      {/* Khoảng giá */}
      <div className="adv-section">
        <p className="adv-label">Khoảng giá</p>
        <div className="adv-chips price-range-chips">
          {PRICE_RANGES.map(r => (
            <button key={r.value}
              className={`adv-chip${priceRange === r.value ? ' active' : ''}`}
              onClick={() => setPriceRange(prev => prev === r.value ? '' : r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="adv-divider" />

      {/* Thể loại */}
      <div className="adv-section">
        <p className="adv-label">Thể loại</p>
        <div className="adv-chips">
          {CATEGORIES.filter(c => c.value !== '').map(c => (
            <button key={c.value}
              className={`adv-chip${category === c.value ? ' active' : ''}`}
              onClick={() => setCategory(prev => prev === c.value ? '' : c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-footer">
        <button className="filter-reset-btn" onClick={reset}>Thiết lập lại</button>
        <button className="filter-apply-btn" onClick={apply}>Áp dụng</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EventsPage (Main)
══════════════════════════════════════════ */
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get('search') || '';
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateFilter, setDateFilter] = useState({ preset: 'all', from: null, to: null });
  const [advFilter, setAdvFilter] = useState({ city: 'all', priceRange: '', category: '' });

  // Dropdown open state
  const [dateOpen, setDateOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);

  const dateRef = useRef(null);
  const advRef = useRef(null);
  useOutsideClick(dateRef, () => setDateOpen(false));
  useOutsideClick(advRef, () => setAdvOpen(false));

  const buildParams = useCallback((s, df, af) => {
    const p = new URLSearchParams();
    if (s) p.set('search', s);
    if (af.category) p.set('category', af.category);
    if (df.from) p.set('dateFrom', toISO(df.from));
    if (df.to) p.set('dateTo', toISO(df.to));
    if (af.city && af.city !== 'all' && af.city !== 'other') p.set('city', af.city);
    if (af.priceRange) {
      const range = PRICE_RANGES.find(r => r.value === af.priceRange);
      if (range?.min !== null) p.set('priceMin', String(range.min));
      if (range?.max !== null) p.set('priceMax', String(range.max));
    }
    return p.toString();
  }, []);

  const fetchEvents = useCallback(async (s = searchKeyword, df = dateFilter, af = advFilter) => {
    setLoading(true);
    try {
      const data = await api.getEvents(buildParams(s, df, af));
      setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, dateFilter, advFilter, buildParams]);

  useEffect(() => { fetchEvents(); }, [searchKeyword, fetchEvents]); // reload on mount and search changes

  const applyDate = (df) => { setDateFilter(df); fetchEvents(searchKeyword, df, advFilter); };
  const applyAdv = (af) => { setAdvFilter(af); fetchEvents(searchKeyword, dateFilter, af); };

  // Count active advanced filters
  const advActiveCount = [
    advFilter.city !== 'all',
    !!advFilter.priceRange,
    !!advFilter.category,
  ].filter(Boolean).length;

  // Date button label
  const dateBtnLabel = () => {
    if (dateFilter.preset === 'all') return 'Tất cả các ngày';
    const found = DATE_PRESETS.find(p => p.value === dateFilter.preset);
    if (found && dateFilter.preset !== 'custom') return found.label;
    if (dateFilter.from && dateFilter.to) return `${toISO(dateFilter.from)} → ${toISO(dateFilter.to)}`;
    if (dateFilter.from) return `Từ ${toISO(dateFilter.from)}`;
    return 'Tất cả các ngày';
  };

  return (
    <div className="events-page container">
      <div className="page-header">
        <h1 className="page-title">Sự kiện</h1>
        <p className="page-subtitle">Tìm và đặt vé cho các sự kiện hấp dẫn</p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="ep-filter-bar">
        {/* Date dropdown */}
        <div className="ep-dropdown-wrap" ref={dateRef}>
          <button
            className={`ep-filter-btn${dateFilter.preset !== 'all' || dateFilter.from ? ' ep-filter-btn--active' : ''}`}
            onClick={() => { setDateOpen(v => !v); setAdvOpen(false); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {dateBtnLabel()}
            {(dateFilter.preset !== 'all' || dateFilter.from) && (
              <span className="ep-close-x" onClick={e => { e.stopPropagation(); applyDate({ preset: 'all', from: null, to: null }); }}>×</span>
            )}
            {!(dateFilter.preset !== 'all' || dateFilter.from) && <span className="ep-caret">▾</span>}
          </button>
          {dateOpen && (
            <DateFilterDropdown value={dateFilter} onApply={applyDate} onClose={() => setDateOpen(false)} />
          )}
        </div>

        {/* Advanced filter dropdown */}
        <div className="ep-dropdown-wrap" ref={advRef}>
          <button
            className={`ep-filter-btn${advActiveCount > 0 ? ' ep-filter-btn--active' : ''}`}
            onClick={() => { setAdvOpen(v => !v); setDateOpen(false); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Bộ lọc
            {advActiveCount > 0 ? (
              <span className="ep-close-x" onClick={e => { e.stopPropagation(); applyAdv({ city: 'all', isFree: false, category: '' }); }}>×</span>
            ) : (
              <span className="ep-caret">▾</span>
            )}
            {advActiveCount > 0 && <span className="ep-badge">{advActiveCount}</span>}
          </button>
          {advOpen && (
            <AdvancedFilterDropdown value={advFilter} onApply={applyAdv} onClose={() => setAdvOpen(false)} />
          )}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="ep-result-count">
          {searchKeyword ? `Kết quả tìm kiếm cho "${searchKeyword}": ` : 'Kết quả tìm kiếm: '}
          <strong style={{ color: 'var(--accent-primary)' }}>{events.length} sự kiện</strong>
        </p>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="container"><SkeletonEventGrid count={6} /></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy sự kiện nào phù hợp với bộ lọc của bạn.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event, idx) => {
            const minPrice = event.sections?.length > 0
              ? Math.min(...event.sections.map(s => parseFloat(s.price)))
              : null;
            const delayClass = idx < 6 ? `anim-delay-${Math.min(idx + 1, 5)}` : '';
            return (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className={`event-card card anim-entrance ${delayClass}`}
              >
                <div className="event-card-image" style={{ background: `linear-gradient(135deg, ${event.sections?.[0]?.colorCode || '#e53e3e'}33, #f8f8f6)` }}>
                  <FavoriteButton eventId={event.id} />
                  <span className="event-category">{event.category}</span>
                </div>
                <div className="event-card-body">
                  <h3 className="event-card-title">{event.title}</h3>
                  <p className="event-card-date" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
                    </svg>
                    <span style={{ lineHeight: 1.5 }}>{formatDate(event.eventDate)}</span>
                  </p>
                  <p className="event-card-venue" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span style={{ lineHeight: 1.5 }}>{event.venueName}</span>
                  </p>
                  {minPrice !== null && (
                    <p className="event-card-price">
                      {minPrice === 0 ? 'Miễn phí' : `Từ ${formatCurrency(minPrice)}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
