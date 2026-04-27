import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { formatDate } from '../../utils/formatDate';
import './AdminPages.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'ended', label: 'Ended' },
];

export default function ManageEventsPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [venueSearch, setVenueSearch] = useState('');

  useEffect(() => {
    // Load all events in one request (no status filter → backend returns published by default)
    // We pass status overrides manually to get all statuses
    Promise.all([
      api.getEvents('limit=100&status=published'),
      api.getEvents('limit=100&status=draft'),
      api.getEvents('limit=100&status=ended'),
    ])
      .then(([pub, draft, ended]) => {
        const merged = [
          ...(pub.events || []),
          ...(draft.events || []),
          ...(ended.events || []),
        ];
        // Deduplicate by id
        const unique = Array.from(new Map(merged.map(e => [e.id, e])).values());
        // Sort by eventDate DESC (newest first)
        unique.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
        setAllEvents(unique);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Client-side filtering with useMemo
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Search by name
      if (search.trim() && !event.title.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
      // Filter by status
      if (statusFilter && event.status !== statusFilter) return false;
      // Filter by date range
      if (dateFrom) {
        const evDate = new Date(event.eventDate);
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (evDate < from) return false;
      }
      if (dateTo) {
        const evDate = new Date(event.eventDate);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (evDate > to) return false;
      }
      // Filter by venue
      if (venueSearch.trim() && !event.venueName?.toLowerCase().includes(venueSearch.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [allEvents, search, statusFilter, dateFrom, dateTo, venueSearch]);

  const hasFilter = search || statusFilter || dateFrom || dateTo || venueSearch;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setVenueSearch('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sự kiện này?')) return;
    try {
      await api.deleteEvent(id);
      setAllEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page container">
      <div className="page-header">
        <h1 className="page-title">Quản lý sự kiện</h1>
        <Link to="/admin/events/create" className="btn btn-primary">+ Tạo sự kiện mới</Link>
      </div>

      {/* ── Filter Bar ── */}
      <div className="admin-filter-bar card">
        {/* Search by name */}
        <div className="admin-filter-field admin-filter-field--wide">
          <svg className="admin-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="manage-search"
            className="admin-filter-input"
            placeholder="Tìm theo tên sự kiện..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <select
          id="manage-status"
          className="admin-filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Date from */}
        <input
          id="manage-date-from"
          type="date"
          className="admin-filter-date"
          title="Từ ngày"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />

        {/* Date to */}
        <input
          id="manage-date-to"
          type="date"
          className="admin-filter-date"
          title="Đến ngày"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />

        {/* Venue search */}
        <div className="admin-filter-field">
          <svg className="admin-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <input
            id="manage-venue"
            className="admin-filter-input"
            placeholder="Địa điểm..."
            value={venueSearch}
            onChange={e => setVenueSearch(e.target.value)}
          />
        </div>

        {/* Clear filters */}
        {hasFilter && (
          <button className="admin-clear-btn" onClick={clearFilters} title="Xóa tất cả bộ lọc">
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="admin-result-count">
        Hiển thị <strong>{filteredEvents.length}</strong> / {allEvents.length} sự kiện
        {hasFilter && <span className="admin-result-filtered"> (đang lọc)</span>}
      </p>

      {/* Table */}
      <div className="admin-table-container card">
        {filteredEvents.length === 0 ? (
          <div className="admin-empty-state">
            <span>🔎</span>
            <p>Không tìm thấy sự kiện nào phù hợp</p>
            {hasFilter && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Ngày</th>
                <th>Địa điểm</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.id} className="admin-table-row">
                  <td className="admin-table-title">{event.title}</td>
                  <td className="admin-table-date">{formatDate(event.eventDate)}</td>
                  <td>{event.venueName}</td>
                  <td>
                    <span className={`status-badge status-${event.status}`}>{event.status}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/events/${event.id}`} className="btn btn-sm btn-secondary">Xem</Link>
                      {event.status === 'draft' && (
                        <Link to={`/admin/events/${event.id}/edit`} className="btn btn-sm btn-warning">Sửa</Link>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
