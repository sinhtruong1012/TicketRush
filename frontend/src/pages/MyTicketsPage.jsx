import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import './MyTicketsPage.css';

export default function MyTicketsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQr, setExpandedQr] = useState(null); // itemId of expanded QR

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    api.getMyTickets()
      .then(data => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  // Flatten orders → individual seat tickets
  const tickets = orders.flatMap(order =>
    (order.items ?? []).map(item => ({
      orderId: order.id,
      event: order.event,
      totalAmount: order.totalAmount,
      seatLabel: `${item.seat?.section?.name ?? ''} — ${item.seat?.rowLabel ?? ''}${item.seat?.seatNumber ?? ''}`,
      price: item.priceAtPurchase,
      qrCodeData: item.qrCodeData,
      itemId: item.id,
    }))
  );

  const now = new Date();
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.event?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStatus = true;
    if (filterStatus === 'upcoming') {
      matchesStatus = new Date(ticket.event?.eventDate) >= now;
    } else if (filterStatus === 'past') {
      matchesStatus = new Date(ticket.event?.eventDate) < now;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="my-tickets container">
      <div className="page-header">
        <h1 className="page-title">Vé của tôi</h1>
        <p className="page-subtitle">
          {tickets.length > 0 ? `${tickets.length} vé đã mua` : 'Danh sách vé đã mua'}
        </p>
      </div>

      {tickets.length > 0 && (
        <div className="ticket-controls">
          <div className="ticket-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="ticket-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="past">Đã diễn ra</option>
          </select>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="empty-state">Bạn chưa mua vé nào</div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-state">Không tìm thấy vé nào phù hợp với điều kiện lọc</div>
      ) : (
        <div className="tickets-grid">
          {filteredTickets.map(ticket => (
            <div key={ticket.itemId} className="ticket-card card">
              {/* Header strip */}
              <div className="ticket-header">
                <h3>{ticket.event?.title}</h3>
                <span className="ticket-badge">Đã thanh toán</span>
              </div>

              {/* Body: info + QR side by side */}
              <div className="ticket-body">
                <div className="ticket-info">
                  <p>📅 {formatDate(ticket.event?.eventDate)}</p>
                  <p>📍 {ticket.event?.venueName}</p>
                  <p className="ticket-seat">💺 {ticket.seatLabel}</p>
                  <p className="ticket-price">{formatCurrency(ticket.price)}</p>
                </div>

                <div
                  className={`ticket-qr ${expandedQr === ticket.itemId ? 'ticket-qr--expanded' : ''}`}
                  onClick={() => setExpandedQr(expandedQr === ticket.itemId ? null : ticket.itemId)}
                  title="Nhấn để phóng to QR"
                >
                  {ticket.qrCodeData ? (
                    <img src={ticket.qrCodeData} alt={`QR ${ticket.seatLabel}`} />
                  ) : (
                    <div className="qr-placeholder">Chưa có QR</div>
                  )}
                  <span className="qr-hint">
                    {expandedQr === ticket.itemId ? 'Thu nhỏ' : 'Phóng to'}
                  </span>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="ticket-divider" />
              <div className="ticket-footer">
                <span>Mã đơn #{ticket.orderId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
