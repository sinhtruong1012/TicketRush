import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SocketContext } from '../context/SocketContext';
import { useAuth } from '../hooks/useAuth';
import './WaitingRoomPage.css';

export default function WaitingRoomPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const { user } = useAuth();
  const [queue, setQueue] = useState(null);
  const [joined, setJoined] = useState(false);

  // Step 1: Join the queue via API on mount
  useEffect(() => {
    if (joined) return;
    api.joinQueue(eventId)
      .then(data => {
        setQueue(data.entry);
        setJoined(true);
      })
      .catch(console.error);
  }, [eventId, joined]);

  // Step 2: Join socket room to receive real-time admitted notification
  useEffect(() => {
    if (!socket || !user || !joined) return;

    socket.emit('join:queue', { eventId, userId: user.id });

    const handleAdmitted = () => {
      navigate(`/events/${eventId}/seats`);
    };

    socket.on('queue:admitted', handleAdmitted);
    return () => socket.off('queue:admitted', handleAdmitted);
  }, [socket, user, eventId, joined, navigate]);

  // Step 3: Polling fallback — update position display every 3s
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getQueueStatus(eventId);
        if (data.status === 'admitted') {
          clearInterval(interval);
          navigate(`/events/${eventId}/seats`);
          return;
        }
        setQueue(data);
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [eventId, joined, navigate]);

  return (
    <div className="waiting-room">
      <div className="waiting-card card">
        <div className="waiting-animation">
          <div className="pulse-ring" />
          <div className="pulse-ring delay-1" />
          <div className="pulse-ring delay-2" />
          <span className="waiting-icon">⏳</span>
        </div>
        <h1>Phòng chờ</h1>
        <p className="waiting-message">Hệ thống đang quá tải. Vui lòng chờ đến lượt bạn.</p>
        {queue && (
          <div className="queue-info">
            <div className="queue-position">
              <span className="position-number">{queue.position || '...'}</span>
              <span className="position-label">Vị trí trong hàng đợi</span>
            </div>
            {queue.estimatedMinutes && (
              <p className="queue-estimate">Thời gian ước tính: ~{queue.estimatedMinutes} phút</p>
            )}
          </div>
        )}
        <p className="waiting-warning">⚠️ Vui lòng không tải lại trang</p>
      </div>
    </div>
  );
}
