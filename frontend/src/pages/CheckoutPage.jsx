import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCountdown } from '../hooks/useCountdown';
import { formatCurrency } from '../utils/formatCurrency';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    api.getOrder(orderId).then(data => setOrder(data.order)).catch(console.error).finally(() => setLoading(false));
  }, [orderId]);

  const countdown = useCountdown(order?.expiresAt);

  // Block tab/window close while order is pending
  useEffect(() => {
    if (order?.status !== 'pending') return;
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [order?.status]);

  // Intercept browser back button
  useEffect(() => {
    if (order?.status !== 'pending') return;

    // Push dummy state so we can detect popstate
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Re-push to prevent actual back navigation
      window.history.pushState(null, '', window.location.href);
      setShowCancelModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [order?.status]);

  useEffect(() => {
    if (countdown.expired && order?.status === 'pending') {
      setShowExpiredModal(true);
    }
  }, [countdown.expired, order?.status]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      const data = await api.confirmOrder(orderId);
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelAndLeave = async () => {
    setCancelling(true);
    try {
      await api.cancelOrder(orderId);
    } catch (_) {
      // Order may already be expired/cancelled — still navigate away
    } finally {
      setCancelling(false);
      navigate(`/events/${order.eventId}/seats`);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!order) return <div className="empty-state">Đơn hàng không tồn tại</div>;

  return (
    <div className="checkout container">
      <div className="checkout-card card">
        {order.status === 'paid' ? (
          <div className="checkout-success">
            <div className="success-icon"></div>
            <h1>Thanh toán thành công!</h1>
            <p>Vé của bạn đã được xác nhận</p>
            {order.qrCodeData && <img src={order.qrCodeData} alt="QR Code" className="qr-image" />}
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/my-tickets')}>Xem vé của tôi</button>
          </div>
        ) : (
          <>
            <h1 className="checkout-title">Thanh toán</h1>

            {!countdown.expired && (
              <div className="countdown">
                <span className="countdown-label">Thời gian còn lại:</span>
                <span className="countdown-timer">
                  {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div className="order-summary">
              <h3>Chi tiết đơn hàng</h3>
              <div className="order-event">{order.event?.title}</div>
              <ul className="order-items">
                {order.items?.map(item => (
                  <li key={item.id} className="order-item">
                    <span>{item.seat?.section?.name} — {item.seat?.rowLabel}{item.seat?.seatNumber}</span>
                    <span>{formatCurrency(item.priceAtPurchase)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-total">
                <span>Tổng cộng:</span>
                <span className="total-amount">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            <button
              className="btn btn-gold btn-lg"
              style={{ width: '100%' }}
              onClick={handleConfirm}
              disabled={confirming || countdown.expired}
            >
              {confirming ? 'Đang xử lý...' : countdown.expired ? 'Đã hết hạn' : 'XÁC NHẬN THANH TOÁN'}
            </button>
          </>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="cancel-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="cancel-modal-title">Hủy đơn hàng?</h2>
            <p className="cancel-modal-desc">Bạn có chắc chắn muốn tiếp tục?</p>
            <ul className="cancel-modal-list">
              <li>Bạn sẽ mất vị trí mình đã lựa chọn.</li>
            </ul>
            <div className="cancel-modal-actions">
              <button
                id="btn-confirm-cancel"
                className="cancel-modal-btn cancel-modal-btn--cancel"
                onClick={handleCancelAndLeave}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
              <button
                id="btn-stay"
                className="cancel-modal-btn cancel-modal-btn--stay"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Ở lại
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expired modal */}
      {showExpiredModal && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">
            <h2 className="cancel-modal-title">Hết thời gian giữ vé!</h2>
            <div className="expired-modal-icon"></div>
            <p className="cancel-modal-desc">Đã hết thời gian giữ vé. Vui lòng đặt lại vé mới.</p>
            <button
              id="btn-rebook"
              className="expired-modal-btn"
              onClick={() => navigate(`/events/${order.eventId}/seats`)}
            >
              Đặt vé mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
