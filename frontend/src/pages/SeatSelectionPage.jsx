import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { useConfig } from '../hooks/useConfig';
import { formatCurrency } from '../utils/formatCurrency';
import { AuthContext } from '../context/AuthContext';
import './SeatSelectionPage.css';

export default function SeatSelectionPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useContext(AuthContext);
  const config = useConfig();
  const MAX_SEATS = config.MAX_SEATS_PER_ORDER;
  const [sections, setSections] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockingId, setLockingId] = useState(null);
  const [error, setError] = useState('');

  const [eventInfo, setEventInfo] = useState(null);

  const fetchSeats = useCallback(async () => {
    try {
      const data = await api.getSeats(eventId);
      setSections(data.sections);
      if (data.event) setEventInfo(data.event);

      // Restore seats that the current user has already locked
      if (user) {
        const myLockedSeats = [];
        data.sections.forEach(section => {
          section.seats.forEach(seat => {
            if (seat.status === 'locked' && seat.lockedBy === user.id) {
              myLockedSeats.push({
                ...seat,
                sectionName: section.name,
                price: section.price,
              });
            }
          });
        });
        setSelectedSeats(myLockedSeats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => { fetchSeats(); }, [fetchSeats]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:event', eventId);

    const handleSeatUpdate = ({ seatId, status }) => {
      setSections(prev => prev.map(section => ({
        ...section,
        seats: section.seats.map(seat =>
          seat.id === seatId ? { ...seat, status } : seat
        ),
      })));
      setSelectedSeats(prev => prev.filter(s => s.id !== seatId || status === 'locked'));
    };

    socket.on('seat:locked', handleSeatUpdate);
    socket.on('seat:released', handleSeatUpdate);
    socket.on('seat:sold', handleSeatUpdate);

    return () => {
      socket.emit('leave:event', eventId);
      socket.off('seat:locked', handleSeatUpdate);
      socket.off('seat:released', handleSeatUpdate);
      socket.off('seat:sold', handleSeatUpdate);
    };
  }, [socket, eventId]);

  const handleSeatClick = async (seat, section) => {
    if (lockingId) return;

    const isSelected = selectedSeats.find(s => s.id === seat.id);

    // Allow deselecting own seats, block other unavailable seats
    if (!isSelected && seat.status !== 'available') return;
    if (isSelected) {
      // Unlock
      setLockingId(seat.id);
      try {
        await api.unlockSeat(seat.id);
        setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLockingId(null);
      }
      return;
    }

    if (selectedSeats.length >= MAX_SEATS) {
      setError(`Tối đa ${MAX_SEATS} ghế mỗi đơn`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Lock seat
    setLockingId(seat.id);
    setError('');
    try {
      await api.lockSeat(seat.id);
      setSelectedSeats(prev => [...prev, { ...seat, sectionName: section.name, price: section.price }]);
    } catch (err) {
      setError(err.message || 'Ghế đã được người khác chọn');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLockingId(null);
    }
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) return;
    try {
      const data = await api.createOrder({
        eventId: parseInt(eventId),
        seatIds: selectedSeats.map(s => s.id),
      });
      navigate(`/checkout/${data.order.id}`);
    } catch (err) {
      // [FIX 25] Multi-tab: backend returns 409 + orderId when a pending order already exists
      if (err.status === 409 && err.orderId) {
        navigate(`/checkout/${err.orderId}`);
        return;
      }
      setError(err.message);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + parseFloat(s.price), 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="seat-selection container">
      {error && <div className="toast toast-error">{error}</div>}

      <div className="seat-layout">
        <div className="seat-map-area">
          <h2 className="seat-map-title" style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>CHỌN GHẾ</h2>
          <div className="stage">SÂN KHẤU</div>

          {sections.map(section => (
            <div key={section.id} className="seat-section">
              <h3 className="section-header" style={{ color: section.colorCode }}>
                {section.name} — {formatCurrency(section.price)}
              </h3>
              <div className="seat-grid">
                {Array.from(new Set(section.seats.map(s => s.rowLabel))).sort().map(row => (
                  <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    <div className="row-seats">
                      {section.seats
                        .filter(s => s.rowLabel === row)
                        .sort((a, b) => a.id - b.id)
                        .map(seat => {
                          if (seat.seatNumber === 0) {
                            return <div key={seat.id} className="seat" style={{ visibility: 'hidden', pointerEvents: 'none' }} />;
                          }

                          const isSelected = selectedSeats.find(s => s.id === seat.id);
                          const isLocking = lockingId === seat.id;
                          return (
                            <button
                              key={seat.id}
                              className={`seat seat--${seat.status} ${isSelected ? 'seat--selected' : ''} ${isLocking ? 'seat--locking' : ''}`}
                              onClick={() => handleSeatClick(seat, section)}
                              disabled={seat.status !== 'available' && !isSelected}
                              title={`${section.name} ${seat.rowLabel}${seat.seatNumber}`}
                            >
                              {seat.seatNumber}
                            </button>
                          );
                        })}
                    </div>
                    <span className="row-label">{row}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="seat-legend">
            <div className="legend-item"><span className="legend-dot legend-dot--available" /> Trống</div>
            <div className="legend-item"><span className="legend-dot legend-dot--locked" /> Đã giữ</div>
            <div className="legend-item"><span className="legend-dot legend-dot--sold" /> Đã bán</div>
            <div className="legend-item"><span className="legend-dot legend-dot--selected" /> Đang chọn</div>
          </div>
        </div>

        <div className="seat-sidebar">
          <div className="sidebar-card card anim-entrance anim-delay-2">
            {eventInfo && (
              <div className="sidebar-event-info">
                {eventInfo.posterUrl && <img src={eventInfo.posterUrl} alt="Poster" className="sidebar-poster" />}
                <div className="sidebar-event-details">
                  <h3 className="sidebar-event-title">{eventInfo.title}</h3>
                  <p className="sidebar-event-venue">{eventInfo.venueName}</p>
                  <p className="sidebar-event-time">
                    {new Date(eventInfo.eventDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(eventInfo.eventDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            )}

            <div className="sidebar-section-title">Ghế đã chọn</div>
            {selectedSeats.length === 0 ? (
              <p className="sidebar-empty">Chưa chọn ghế nào</p>
            ) : (
              <ul className="selected-list">
                {selectedSeats.map(seat => (
                  <li key={seat.id} className="selected-item">
                    <div className="selected-seat-info">
                      <span className="selected-seat-badge">{seat.rowLabel}{seat.seatNumber}</span>
                      <span className="selected-seat-section">Khu vực {seat.sectionName}</span>
                    </div>
                    <span className="selected-seat-price">{formatCurrency(seat.price)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="sidebar-total">
              <span>Tổng cộng</span>
              <span className="total-price">{formatCurrency(totalPrice)}</span>
            </div>

            <button className="btn sidebar-btn-checkout" onClick={handleCheckout} disabled={selectedSeats.length === 0}>
              Tiếp tục thanh toán {selectedSeats.length > 0 && `(${selectedSeats.length}/${MAX_SEATS})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
