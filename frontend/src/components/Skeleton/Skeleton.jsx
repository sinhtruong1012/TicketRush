import './Skeleton.css';

/**
 * Base Skeleton block with shimmer animation.
 */
export function Skeleton({ width = '100%', height = '1rem', rounded = false, className = '' }) {
  return (
    <div
      className={`skeleton ${rounded ? 'skeleton--rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for an event card (used in EventsPage grid).
 */
export function SkeletonEventCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton height="200px" className="skeleton-card__image" />
      <div className="skeleton-card__body">
        <Skeleton height="0.75rem" width="40%" />
        <Skeleton height="1.1rem" width="85%" className="skeleton-card__title" />
        <Skeleton height="0.85rem" width="60%" />
        <Skeleton height="0.85rem" width="50%" />
        <div className="skeleton-card__footer">
          <Skeleton height="0.95rem" width="35%" />
          <Skeleton height="2rem" width="28%" rounded />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of 6 event card skeletons for EventsPage.
 */
export function SkeletonEventGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid" aria-label="Đang tải sự kiện...">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonEventCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for EventDetailPage (poster + info columns).
 */
export function SkeletonEventDetail() {
  return (
    <div className="skeleton-detail" aria-hidden="true">
      <Skeleton height="420px" className="skeleton-detail__poster" />
      <div className="skeleton-detail__info">
        <Skeleton height="0.75rem" width="30%" />
        <Skeleton height="2.2rem" width="90%" className="skeleton-card__title" />
        <Skeleton height="2.2rem" width="70%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <Skeleton height="0.9rem" width="55%" />
          <Skeleton height="0.9rem" width="45%" />
          <Skeleton height="0.9rem" width="50%" />
        </div>
        <Skeleton height="3rem" width="100%" rounded className="skeleton-card__title" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a ticket row in MyTicketsPage.
 */
export function SkeletonTicketRow() {
  return (
    <div className="skeleton-ticket" aria-hidden="true">
      <Skeleton height="80px" width="80px" className="skeleton-ticket__qr" />
      <div className="skeleton-ticket__info">
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="0.8rem" width="40%" />
        <Skeleton height="0.8rem" width="30%" />
      </div>
      <Skeleton height="1.5rem" width="80px" rounded />
    </div>
  );
}
