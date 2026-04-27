import { useState, useEffect } from 'react';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatCurrency';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminPages.css';

export default function RealtimeDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRealtimeStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state">Không thể tải dữ liệu</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Real-time Dashboard</h1>
          <p className="text-gray-500 mt-1">Dữ liệu thời gian thực được cập nhật liên tục.</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card card">
          <span className="stat-card-label">DOANH THU THỜI GIAN THỰC</span>
          <span className="stat-card-value text-blue-500">{formatCurrency(stats.summary.totalRevenue)}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card-label">VÉ ĐÃ BÁN (HÔM NAY)</span>
          <span className="stat-card-value text-green-500">{stats.summary.ticketsSoldToday}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card-label">TỔNG SỐ SỰ KIỆN ACTIVE</span>
          <span className="stat-card-value">{stats.summary.activeEvents}</span>
        </div>
      </div>

      <div className="charts-grid mt-4">
        <div className="chart-card card span-2">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Doanh thu 30 ngày
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.revenueByDate}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#000' }} 
                formatter={(val) => formatCurrency(val)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00D4FF" strokeWidth={3} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Tỉ lệ lấp đầy
          </h3>
          <div className="fill-rates">
            {stats.seatFillRate.map(event => (
              <div key={event.eventId} className="fill-rate-item">
                <div className="fill-rate-header">
                  <span className="fill-rate-title" title={event.title}>{event.title}</span>
                  <span className="fill-rate-percent text-blue-600 font-bold">{event.fillRate}%</span>
                </div>
                <div className="fill-rate-bar">
                  <div className="fill-rate-progress" style={{ width: `${event.fillRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mb-4">Giao dịch mới nhất</h3>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Sự kiện</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map(order => (
                <tr key={order.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar-sm">
                        {order.user.avatar ? (
                          <img src={order.user.avatar} alt="avatar" />
                        ) : (
                          <div className="avatar-placeholder">{order.user.fullName.charAt(0)}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{order.user.fullName}</div>
                        <div className="text-xs text-gray-500">{order.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>Đơn #{order.id}</td>
                  <td>{new Date(order.paidAt).toLocaleString()}</td>
                  <td className="font-bold">{formatCurrency(order.totalAmount)}</td>
                  <td><span className="badge badge-success">Thành công</span></td>
                </tr>
              ))}
              {stats.recentTransactions.length === 0 && (
                <tr><td colSpan="5" className="text-center py-4">Chưa có giao dịch nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
